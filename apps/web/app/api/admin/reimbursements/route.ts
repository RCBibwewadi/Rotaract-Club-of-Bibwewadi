import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const SHEET_ID = '1zZZVzqN9oOHxdSX0JWL9d4TN7xpPqer6K6-TiVoUwWc';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const BUCKET = 'media';
const SIGNED_URL_TTL = 60 * 10; // 10 minutes

// ---------- CSV helpers ----------

/** Minimal RFC-4180 CSV row parser (handles quoted fields with commas). */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let value = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      i++; // skip comma
    } else {
      const next = line.indexOf(',', i);
      if (next === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, next));
      i = next + 1;
    }
  }
  return fields;
}

/**
 * Split CSV text into logical rows, respecting quoted fields that contain newlines.
 * A line that opens a quote without closing it is joined with subsequent lines
 * until the quote is closed.
 */
function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  const lines = text.split('\n');
  let current = '';
  let inQuote = false;

  for (const line of lines) {
    if (!inQuote) {
      current = line;
    } else {
      current += '\n' + line;
    }

    let quotes = 0;
    for (let i = 0; i < current.length; i++) {
      if (current[i] === '"') quotes++;
    }
    inQuote = quotes % 2 !== 0;

    if (!inQuote) {
      if (current.trim()) rows.push(current);
      current = '';
    }
  }
  if (current.trim()) rows.push(current);
  return rows;
}

function parseCSV(text: string): Record<string, string>[] {
  const rows = splitCSVRows(text);
  if (rows.length < 2) return [];
  const headers = parseCSVRow(rows[0]);
  return rows.slice(1).map(line => {
    const cols = parseCSVRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

// ---------- Field mapping ----------

/** Parse US-style date "M/D/YYYY" → "YYYY-MM-DD" or null. */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  const parts = raw.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Parse Google Form timestamp "M/D/YYYY H:MM:SS" → ISO string. */
function parseTimestamp(raw: string): string | null {
  if (!raw) return null;
  const [datePart, timePart] = raw.split(' ');
  const date = parseDate(datePart);
  if (!date) return null;
  return `${date}T${timePart || '00:00:00'}`;
}

// Actual sheet columns:
// Timestamp, Name, Designation, Date, Amount, Purpose of Expense,
// Supporting Documents, UNDERTAKING & DECLARATION
interface MappedRow {
  form_timestamp: string;
  person_name: string;
  designation: string;
  person_email: string;
  event_name: string;
  purpose: string;
  amount_inr: number;
  screenshot_paths: string;
  expense_date: string | null;
  status: string;
}

async function mapRow(
  row: Record<string, string>,
): Promise<MappedRow | null> {
  const ts = parseTimestamp(row['Timestamp'] ?? '');
  if (!ts) return null;

  // Store original Drive URLs directly (files are private, can't mirror without auth)
  const rawDocs = (row['Supporting Documents'] ?? '').trim();

  return {
    form_timestamp: ts,
    person_name: row['Name'] ?? '',
    designation: row['Designation'] ?? '',
    person_email: row['Email'] ?? '',
    event_name: row['Event Name'] ?? '',
    purpose: row['Purpose of Expense'] ?? '',
    amount_inr: parseInt(row['Amount'] || '0', 10) || 0,
    screenshot_paths: rawDocs,
    expense_date: parseDate(row['Date'] ?? ''),
    status: 'Fetched',
  };
}

// ---------- Signed URL helper ----------

/**
 * Attach screenshot URLs to rows.
 * If screenshot_paths contains Drive URLs (https://), pass them through directly.
 * If they're Supabase storage paths, create signed URLs.
 */
async function attachScreenshotUrls(
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  return Promise.all(
    rows.map(async row => {
      const raw = ((row.screenshot_paths as string) || '').trim();
      if (!raw) return { ...row, screenshot_urls: [] };

      // Split on comma, but Drive URLs also contain commas in query params — not here though.
      // Drive URLs from the form are single URLs per cell or space/comma separated.
      const entries = raw.split(',').map(s => s.trim()).filter(Boolean);

      const urls: string[] = [];
      for (const entry of entries) {
        if (entry.startsWith('http')) {
          // Direct Drive URL — pass through
          urls.push(entry);
        } else {
          // Supabase storage path — create signed URL
          const { data } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(entry, SIGNED_URL_TTL);
          if (data?.signedUrl) urls.push(data.signedUrl);
        }
      }

      return { ...row, screenshot_urls: urls };
    }),
  );
}

// ---------- KPI helper ----------

interface KpiResult {
  total_amount: number;
  total_entries: number;
  pending_count: number;
  highest_spender: { person_name: string; total: number } | null;
  by_status: Record<string, number>;
}

async function computeKpis(): Promise<KpiResult> {
  const { data: rows } = await supabaseAdmin
    .from('reimbursements')
    .select('person_name, amount_inr, status');

  const all = rows || [];

  const total_amount = all.reduce((sum, r) => sum + (r.amount_inr || 0), 0);
  const total_entries = all.length;

  const pendingStatuses = ['Fetched', 'Verification_Pending', 'Payment_Pending'];
  const pending_count = all.filter(r => pendingStatuses.includes(r.status)).length;

  const spenderMap: Record<string, number> = {};
  for (const r of all) {
    const name = r.person_name.toLowerCase().trim();
    spenderMap[name] = (spenderMap[name] || 0) + (r.amount_inr || 0);
  }

  let highest_spender: KpiResult['highest_spender'] = null;
  let maxSpend = 0;
  for (const [name, total] of Object.entries(spenderMap)) {
    if (total > maxSpend) {
      maxSpend = total;
      highest_spender = { person_name: name, total };
    }
  }

  const by_status: Record<string, number> = {};
  for (const r of all) {
    by_status[r.status] = (by_status[r.status] || 0) + 1;
  }

  return { total_amount, total_entries, pending_count, highest_spender, by_status };
}

// ---------- Route handler ----------

/**
 * GET /api/admin/reimbursements
 *
 * Query params:
 *   ?view=kpi          → aggregated KPIs
 *   ?view=list         → filtered list with signed screenshot URLs
 *     &event=X         → filter by event_name
 *     &status=Y        → filter by status
 *     &name=Z          → filter by person_name (case-insensitive partial match)
 *   ?view=sync (default) → fetch new rows from Google Sheet, then return all with signed URLs
 */
export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const view = request.nextUrl.searchParams.get('view') || 'sync';

    // ---- KPI view ----
    if (view === 'kpi') {
      const kpis = await computeKpis();
      return json(successResponse(kpis));
    }

    // ---- List view (filtered, no sheet sync) ----
    if (view === 'list') {
      const event = request.nextUrl.searchParams.get('event');
      const status = request.nextUrl.searchParams.get('status');
      const name = request.nextUrl.searchParams.get('name');

      let query = supabaseAdmin
        .from('reimbursements')
        .select('*')
        .order('form_timestamp', { ascending: false });

      if (event) query = query.eq('event_name', event);
      if (status) query = query.eq('status', status);
      if (name) query = query.ilike('person_name', `%${name}%`);

      const { data, error } = await query;
      if (error) return json(errorResponse('DB_ERROR', error.message), 500);

      const withUrls = await attachScreenshotUrls(data || []);
      return json(successResponse(withUrls));
    }

    // ---- Sync view (default): fetch sheet → insert new → return all ----

    // 1. Fetch CSV from Google Sheets
    const res = await fetch(CSV_URL, { cache: 'no-store' });
    if (!res.ok) {
      return json(
        errorResponse('SHEET_FETCH_ERROR', `Google Sheets returned ${res.status}`),
        502,
      );
    }
    const csvText = await res.text();
    const sheetRows = parseCSV(csvText);

    // 2. Get latest timestamp already in DB
    const { data: latest } = await supabaseAdmin
      .from('reimbursements')
      .select('form_timestamp')
      .order('form_timestamp', { ascending: false })
      .limit(1)
      .single();

    const lastTs = latest?.form_timestamp ?? null;

    // 3. Map, mirror screenshots, & filter only new rows
    const allMapped = await Promise.all(sheetRows.map(mapRow));
    const newRows = allMapped
      .filter((r): r is MappedRow => r !== null)
      .filter(r => !lastTs || r.form_timestamp > lastTs);

    // 4. Insert new rows if any
    if (newRows.length > 0) {
      const { error } = await supabaseAdmin
        .from('reimbursements')
        .upsert(newRows, { onConflict: 'form_timestamp', ignoreDuplicates: true });

      if (error) {
        return json(errorResponse('DB_ERROR', error.message), 500);
      }
    }

    // 5. Return all reimbursements with signed URLs
    const { data: all, error: fetchErr } = await supabaseAdmin
      .from('reimbursements')
      .select('*')
      .order('form_timestamp', { ascending: false });

    if (fetchErr) {
      return json(errorResponse('DB_ERROR', fetchErr.message), 500);
    }

    const withUrls = await attachScreenshotUrls(all || []);

    return json(
      successResponse(withUrls, `${newRows.length} new, ${all?.length ?? 0} total`),
    );
  } catch (err) {
    return handleError(err);
  }
}

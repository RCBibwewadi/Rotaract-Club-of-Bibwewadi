import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

interface AggregatedPerson {
  email: string;
  name: string;
  totalAmount: number;
  entries: number;
  ids: string[];
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function buildEmailHtml(name: string, totalAmount: number): string {
  const date = formatDate();
  const logoUrl = 'https://www.rcbibwewadipune.org/logo.png';
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #8b1a2b, #a82640); padding: 32px; text-align: center;">
        <img src="${logoUrl}" alt="RCB Logo" width="64" height="64" style="border-radius: 50%; margin-bottom: 12px;" />
        <h1 style="color: white; margin: 0; font-size: 24px;">Reimbursement Confirmation</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Rotaract Club of Bibwewadi, Pune</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #374151; line-height: 1.8;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size: 15px; color: #374151; line-height: 1.8;">
          I'm reaching out to confirm that your reimbursement of <strong style="color: #c9a84c;">Rs. ${totalAmount.toLocaleString('en-IN')}/-</strong> was transferred on <strong>${date}</strong> for the expenses incurred by you on behalf of the club.
        </p>
        <p style="font-size: 15px; color: #374151; line-height: 1.8;">
          Could you please reply with "<strong style="color: #8b1a2b;">Acknowledged</strong>" to confirm that the said amount has been duly received by you.
        </p>
        <p style="font-size: 15px; color: #374151; line-height: 1.8; margin-top: 24px;">
          Thank you,<br/>
          <strong>Rtr. Akanksha Navale</strong>,<br/>
          Treasurer,<br/>
          Rotaract Club of Bibwewadi Pune.
        </p>
      </div>
      <div style="background: #8b1a2b; padding: 16px; text-align: center;">
        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Rotaract Club of Bibwewadi, Pune &bull; www.rcbibwewadipune.org</p>
      </div>
    </div>
  `;
}

/**
 * POST /api/admin/reimbursements/acknowledge
 *
 * Body: { ids: string[], sendEmail?: boolean }
 *
 * When sendEmail is true: sends acknowledgment emails via Resend, then sets status to Email_Sent.
 * When sendEmail is false/absent: just sets status to Acknowledged.
 */
export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);
    const { ids, sendEmail } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return json(errorResponse('INVALID_INPUT', 'Provide an array of ids'), 400);
    }

    // Fetch rows being acknowledged
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from('reimbursements')
      .select('id, person_name, person_email, amount_inr, status')
      .in('id', ids)
      .eq('status', 'Payment_Done');

    if (fetchErr) return json(errorResponse('DB_ERROR', fetchErr.message), 500);
    if (!rows || rows.length === 0) {
      return json(errorResponse('NO_ROWS', 'No Payment_Done rows found for given ids'), 400);
    }

    if (!sendEmail) {
      const { error } = await supabaseAdmin
        .from('reimbursements')
        .update({ status: 'Acknowledged' })
        .in('id', rows.map(r => r.id));

      if (error) return json(errorResponse('DB_ERROR', error.message), 500);
      return json(successResponse(null, `${rows.length} reimbursement(s) acknowledged`));
    }

    // Aggregate by email: sum amounts per person
    const personMap = new Map<string, AggregatedPerson>();
    for (const row of rows) {
      const email = (row.person_email || '').trim().toLowerCase();
      if (!email) continue;

      const existing = personMap.get(email);
      if (existing) {
        existing.totalAmount += row.amount_inr || 0;
        existing.entries++;
        existing.ids.push(row.id);
      } else {
        personMap.set(email, {
          email,
          name: row.person_name,
          totalAmount: row.amount_inr || 0,
          entries: 1,
          ids: [row.id],
        });
      }
    }

    // Send emails and update status
    let emailsSent = 0;

    for (const person of personMap.values()) {
      try {
        await getResend().emails.send({
          from: 'Rotaract Club of Bibwewadi <treasurer@rcbibwewadipune.org>',
          replyTo: 'rotaractclubofbibwewadi@gmail.com',
          bcc: 'rotaractclubofbibwewadi@gmail.com',
          to: person.email,
          subject: `Reimbursement Confirmation — Rs. ${person.totalAmount.toLocaleString('en-IN')}/-`,
          html: buildEmailHtml(person.name, person.totalAmount),
        });
        emailsSent++;

        await supabaseAdmin
          .from('reimbursements')
          .update({ status: 'Email_Sent' })
          .in('id', person.ids);
      } catch (emailErr) {
        console.error(`[reimbursements] Failed to email ${person.email}:`, emailErr);
        await supabaseAdmin
          .from('reimbursements')
          .update({ status: 'Acknowledged' })
          .in('id', person.ids);
      }
    }

    // Handle rows without email — just mark Acknowledged
    const noEmailIds = rows
      .filter(r => !((r.person_email || '').trim()))
      .map(r => r.id);

    if (noEmailIds.length > 0) {
      await supabaseAdmin
        .from('reimbursements')
        .update({ status: 'Acknowledged' })
        .in('id', noEmailIds);
    }

    return json(successResponse(
      { emailsSent, totalRows: rows.length },
      `${rows.length} acknowledged, ${emailsSent} email(s) sent`,
    ));
  } catch (err) {
    return handleError(err);
  }
}

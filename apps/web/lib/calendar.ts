// Calendar link + .ics generation. No accounts, OAuth or third-party services:
// Google gets a pre-filled template URL, everyone else gets an RFC 5545 file.

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  /** IANA zone the event is actually held in, e.g. 'Asia/Kolkata' */
  timeZone: string;
  /** Stable id so re-downloading updates the same entry instead of duplicating it */
  uid: string;
}

/** Days before the event to fire a reminder; 'none' omits the alarm entirely. */
export type ReminderOption = 'none' | '1' | '2';

/**
 * Absolute UTC timestamp (…Z) form. Both Google and .ics accept this, and it
 * pins the instant exactly, so the event lands at the right local time for a
 * viewer in any zone regardless of their calendar's own timezone setting.
 */
function toUtcStamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`,
    // Times above are absolute; ctz just makes Google show the event's own zone.
    ctz: event.timeZone,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 §3.3.11: backslash, semicolon, comma and newlines are significant.
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const ICS_OCTET_LIMIT = 75;

/**
 * RFC 5545 §3.1: no line may exceed 75 octets; longer ones are folded onto
 * continuation lines starting with a space. Counted in UTF-8 bytes and split
 * on code-point boundaries so emoji in a description can't be cut in half.
 */
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= ICS_OCTET_LIMIT) return line;

  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  // Continuation lines spend one octet on their leading space.
  let limit = ICS_OCTET_LIMIT;

  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    if (currentBytes + charBytes > limit) {
      chunks.push(current);
      current = char;
      currentBytes = charBytes;
      limit = ICS_OCTET_LIMIT - 1;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  chunks.push(current);

  return chunks.map((chunk, i) => (i === 0 ? chunk : ` ${chunk}`)).join('\r\n');
}

export function buildIcs(event: CalendarEvent, reminder: ReminderOption = 'none'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rotaract Club of Bibwewadi//RSVP//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
  ];

  if (reminder !== 'none') {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `TRIGGER:-P${reminder}D`,
      `DESCRIPTION:${escapeIcsText(`Reminder: ${event.title}`)}`,
      'END:VALARM',
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // CRLF terminated, including the final line, per RFC 5545.
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

export function downloadIcs(filename: string, ics: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

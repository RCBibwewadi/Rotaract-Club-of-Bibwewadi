'use client';

import { useState } from 'react';
import { CalendarPlus, Download, BellRing } from 'lucide-react';
import {
  buildGoogleCalendarUrl, buildIcs, downloadIcs,
  type CalendarEvent, type ReminderOption,
} from '@/lib/calendar';

const reminderOptions: { value: ReminderOption; label: string }[] = [
  { value: 'none', label: 'No reminder' },
  { value: '1', label: '1 day before' },
  { value: '2', label: '2 days before' },
];

export default function AddToCalendar({
  event,
  filename = 'event.ics',
}: {
  event: CalendarEvent;
  filename?: string;
}) {
  const [reminder, setReminder] = useState<ReminderOption>('1');

  const when = event.start.toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: event.timeZone,
  });
  const zoneLabel = new Intl.DateTimeFormat('en-IN', {
    timeZone: event.timeZone, timeZoneName: 'short',
  })
    .formatToParts(event.start)
    .find(p => p.type === 'timeZoneName')?.value ?? '';

  return (
    <div className="w-full text-left rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-5">
      <div className="flex items-center gap-2 mb-1">
        <CalendarPlus size={16} className="text-accent" />
        <h4 className="text-dark dark:text-white font-semibold text-sm">Add to your calendar</h4>
      </div>
      <p className="text-dark/40 dark:text-white/40 text-xs mb-4">
        {when} {zoneLabel}
      </p>

      {/* Reminder choice — written into the .ics as an alarm */}
      <div className="mb-4">
        <label className="flex items-center gap-1.5 text-dark/60 dark:text-white/60 text-xs mb-2">
          <BellRing size={12} /> Remind me
        </label>
        <div className="flex flex-wrap gap-2">
          {reminderOptions.map(option => {
            const active = reminder === option.value;
            return (
              <button key={option.value} type="button"
                onClick={() => setReminder(option.value)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'border-accent bg-accent/10 ring-1 ring-accent text-accent'
                    : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-dark/60 dark:text-white/60 hover:border-accent/50'
                }`}>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-light transition-colors duration-300">
          <CalendarPlus size={16} /> Google Calendar
        </a>
        <button type="button"
          onClick={() => downloadIcs(filename, buildIcs(event, reminder))}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 text-dark dark:text-white text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300">
          <Download size={16} /> Download .ics
        </button>
      </div>

      <p className="text-dark/30 dark:text-white/30 text-[11px] mt-3">
        The .ics file works with Outlook, Apple Calendar and most other apps, and carries the
        reminder you picked above. Google Calendar applies your own default reminder instead.
      </p>
    </div>
  );
}

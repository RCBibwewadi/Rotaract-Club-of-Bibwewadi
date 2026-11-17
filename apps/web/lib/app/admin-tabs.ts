import { Megaphone, Users, CalendarDays, Lightbulb, Handshake, ClipboardList } from 'lucide-react';
import type { Tab } from './tabs';

/** The sections of the website's admin panel that the app carries. */
export const ADMIN_TABS: Tab[] = [
  { href: '/app/admin/announcements', label: 'Announcements', short: 'Notices', icon: Megaphone },
  { href: '/app/admin/members', label: 'Members', icon: Users },
  { href: '/app/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/app/admin/registrations', label: 'Registrations', short: 'Forms', icon: ClipboardList },
  { href: '/app/admin/ideas', label: 'IdeaVerse', short: 'Ideas', icon: Lightbulb },
  { href: '/app/admin/referrals', label: 'The Connect', short: 'Connect', icon: Handshake },
];

export const ADMIN_HOME = '/app/admin/announcements';

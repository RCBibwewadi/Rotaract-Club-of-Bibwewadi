import { Megaphone, Users, CalendarDays, Lightbulb } from 'lucide-react';
import type { Tab } from './tabs';

/** The sections of the website's admin panel that the app carries. */
export const ADMIN_TABS: Tab[] = [
  { href: '/app/admin/announcements', label: 'Announcements', short: 'Notices', icon: Megaphone },
  { href: '/app/admin/members', label: 'Members', icon: Users },
  { href: '/app/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/app/admin/ideas', label: 'IdeaVerse', short: 'Ideas', icon: Lightbulb },
];

export const ADMIN_HOME = '/app/admin/announcements';

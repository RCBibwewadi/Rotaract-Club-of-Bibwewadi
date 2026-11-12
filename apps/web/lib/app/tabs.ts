import {
  Lightbulb,
  CalendarDays,
  Megaphone,
  Handshake,
  Users,
  CircleUser,
  type LucideIcon,
} from 'lucide-react';

export interface Tab {
  href: string;
  /** Screen title. */
  label: string;
  /**
   * Bar caption. Six items share a phone's width, so a long title gets a
   * shorter caption here rather than being truncated at render time.
   */
  short?: string;
  icon: LucideIcon;
}

/** The six bottom-bar destinations, in display order. */
export const TABS: Tab[] = [
  { href: '/app/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/app/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/app/announcements', label: 'Announcements', short: 'Notices', icon: Megaphone },
  { href: '/app/referrals', label: 'Referrals', icon: Handshake },
  { href: '/app/members', label: 'Members', icon: Users },
  { href: '/app/profile', label: 'Profile', icon: CircleUser },
];

/** Where a signed-in member lands. */
export const HOME_TAB = '/app/ideas';

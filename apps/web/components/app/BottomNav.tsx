'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABS } from '@/lib/app/tabs';
import { ADMIN_TABS } from '@/lib/app/admin-tabs';
import { tabFor, useUnreadSync } from '@/lib/app/notifications';

/**
 * Shared by the member tab bar and the admin one. The variant picks the tab
 * set here rather than taking it as a prop: the tabs carry icon components,
 * which a server layout cannot pass across to a client component.
 */
export default function BottomNav({ variant = 'member' }: { variant?: 'member' | 'admin' }) {
  const pathname = usePathname();
  const tabs = variant === 'admin' ? ADMIN_TABS : TABS;
  const unread = useUnreadSync(variant === 'member');

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-black/5 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl"
      // Keeps the bar clear of the iPhone home indicator.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-between px-1 pt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          const key = tabFor(tab.href);
          const count = key ? unread[key] : 0;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                aria-label={count > 0 ? `${tab.label}, ${count} new` : tab.label}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-0.5 pt-1 pb-1.5 transition-colors hover:text-accent-light ${
                  active ? 'text-accent' : 'text-neutral-400'
                }`}
              >
                <span className="relative">
                  <Icon size={21} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                  {count > 0 && (
                    // Counted in the label above, so the pill itself is decorative.
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-2.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-accent px-1 text-[9px] font-bold leading-none text-white"
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {tab.short ?? tab.label}
                </span>
                
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

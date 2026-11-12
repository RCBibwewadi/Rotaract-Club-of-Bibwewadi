'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABS } from '@/lib/app/tabs';
import { ADMIN_TABS } from '@/lib/app/admin-tabs';

/**
 * Shared by the member tab bar and the admin one. The variant picks the tab
 * set here rather than taking it as a prop: the tabs carry icon components,
 * which a server layout cannot pass across to a client component.
 */
export default function BottomNav({ variant = 'member' }: { variant?: 'member' | 'admin' }) {
  const pathname = usePathname();
  const tabs = variant === 'admin' ? ADMIN_TABS : TABS;

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

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-1 rounded-2xl px-0.5 pt-1 pb-1.5 transition-colors hover:text-accent-light ${
                  active ? 'text-accent' : 'text-neutral-400'
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
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

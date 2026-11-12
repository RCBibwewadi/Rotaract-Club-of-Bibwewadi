'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, GraduationCap, LogOut, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Screen, Loading, Avatar } from '@/components/app/Screen';

export default function ProfilePage() {
  const { member, fetchProfile, logout } = useAuthStore();
  const router = useRouter();

  // The stored profile can be stale (or absent after a cold start), so refresh
  // it from the same endpoint the website uses.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signOut = () => {
    logout();
    router.replace('/app/login');
  };

  if (!member) {
    return (
      <Screen title="Profile">
        <Loading label="Loading your profile" />
      </Screen>
    );
  }

  const rows = [
    member.email && { icon: Mail, label: member.email, href: `mailto:${member.email}` },
    member.phone && { icon: Phone, label: member.phone, href: `tel:${member.phone}` },
    member.college_name && { icon: GraduationCap, label: member.college_name },
    member.businesses?.[0]?.business_name && {
      icon: Briefcase,
      label: member.businesses[0].business_name,
    },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href?: string }[];

  return (
    <Screen title="Profile">
      <section className="flex flex-col items-center rounded-2xl bg-white p-6 text-center">
        <Avatar name={member.full_name} src={member.avatar_url} size={84} />
        <h2 className="mt-4 text-xl font-bold text-app-plum">{member.full_name}</h2>
        <p className="mt-0.5 text-sm text-app-plum/50">
          {member.member_type?.split(',').join(' · ') || 'Member'}
        </p>
        {member.username && <p className="mt-1 text-xs text-app-plum/35">@{member.username}</p>}
      </section>

      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
          {rows.map((row) => {
            const Icon = row.icon;
            const content = (
              <span className="flex items-center gap-3 px-4 py-3.5">
                <Icon size={17} className="shrink-0 text-app-plum/35" aria-hidden />
                <span className="truncate text-[15px] text-app-plum/75">{row.label}</span>
              </span>
            );
            return (
              <li key={row.label}>
                {row.href ? (
                  <a href={row.href} className="block">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}

      {member.interests && (
        <section className="mt-3 rounded-2xl bg-white p-4">
          <h3 className="text-sm font-semibold text-app-plum/60">Interests</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-app-plum/70">{member.interests}</p>
        </section>
      )}

      <button
        type="button"
        onClick={signOut}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-[15px] font-semibold text-accent"
      >
        <LogOut size={17} aria-hidden />
        Log out
      </button>
    </Screen>
  );
}

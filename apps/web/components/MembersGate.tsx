'use client';

import Link from 'next/link';
import { Lock, Users, Briefcase, Sparkles, Shield, Handshake } from 'lucide-react';

interface MembersGateProps {
  memberCount: number;
  businessCount: number;
}

const perks = [
  { icon: Users, text: 'Browse & connect with every member', sub: 'Find mentors, collaborators & friends' },
  { icon: Briefcase, text: 'Access the business directory', sub: 'Discover member-run ventures' },
  { icon: Handshake, text: 'Unlock collaboration requests', sub: 'Directly reach out to connect' },
];

export default function MembersGate({ memberCount, businessCount }: MembersGateProps) {
  return (
    <div
      className="
        relative z-20
        mx-auto max-w-[560px] w-full
        p-10 sm:p-12
        max-[440px]:p-[26px_20px]
        rounded-[26px]
        border border-white/10
        text-center
      "
      style={{
        background: 'rgba(20,11,13,.72)',
        backdropFilter: 'blur(22px) saturate(140%)',
        WebkitBackdropFilter: 'blur(22px) saturate(140%)',
        boxShadow: '0 8px 60px rgba(139,26,43,.25), 0 0 120px rgba(139,26,43,.08)',
      }}
      role="region"
      aria-label="Members-only content gate"
    >
      {/* Members Only pill */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5"
        style={{ background: 'linear-gradient(135deg,#e23b50,#c5132e)', color: '#fff' }}>
        <Shield size={13} aria-hidden="true" />
        Members Only
      </div>

      {/* Lock icon */}
      <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#e23b50,#c5132e)' }}>
        <Lock size={28} className="text-white" aria-hidden="true" />
      </div>

      {/* Headline — serif-italic matching page title */}
      <h2 className="font-display text-[32px] max-[440px]:text-[27px] leading-tight text-white mb-3">
        Unlock the <span className="italic gradient-text">Inner Circle</span>
      </h2>
      <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
        Our directory is exclusive to club members. Join the Rotaract family to connect, collaborate and grow.
      </p>

      {/* Value props */}
      <div className="space-y-3 mb-7 text-left">
        {perks.map((perk, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.06]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(226,59,80,.15)' }}>
              <perk.icon size={17} className="text-[#e23b50]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium leading-snug">{perk.text}</p>
              <p className="text-white/35 text-xs mt-0.5 max-[440px]:text-[11px]">{perk.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5">
        <Link
          href="/join"
          className="
            w-full flex items-center justify-center gap-2
            py-3.5 max-[440px]:py-3 rounded-xl
            text-white font-semibold text-sm
            min-h-[48px]
            transition-all duration-200
          "
          style={{ background: 'linear-gradient(135deg,#e23b50,#c5132e)' }}
        >
          Join the club to unlock
        </Link>
        <Link
          href="/login"
          className="
            w-full flex items-center justify-center gap-2
            py-3.5 max-[440px]:py-3 rounded-xl
            text-white/60 font-medium text-sm
            border border-white/10 hover:border-white/20
            min-h-[48px]
            transition-all duration-200
          "
        >
          Already a member? Log in
        </Link>
      </div>
    </div>
  );
}

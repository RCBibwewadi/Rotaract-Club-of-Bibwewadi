'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react';
import { appFetch, timeAgo, useResource, ApiError } from '@/lib/app/client';
import { waNumber } from '@/lib/app/format';
import type { Referral, ReferralContact } from '@/lib/app/types';
import { Loading, ErrorState, Avatar } from '@/components/app/Screen';
import PullToRefresh, { refreshApp } from '@/components/app/PullToRefresh';

const THANKS =
  'Thanks for showing interest! Feel free to reach out and connect with the person who posted this referral.';

export default function ReferralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const referral = useResource<Referral>(`/api/referrals/${id}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const expressInterest = async () => {
    if (saving || !referral.data) return;
    setSaving(true);
    setError('');
    try {
      const result = await appFetch<{ contact: ReferralContact | null; interest_count: number }>(
        `/api/referrals/${id}/interest`,
        { method: 'POST' },
      );
      referral.set({
        ...referral.data,
        my_interest: true,
        interest_count: result.interest_count,
        contact: result.contact,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not register your interest');
    } finally {
      setSaving(false);
    }
  };

  const data = referral.data;
  const showInterestBar = !!data && !data.is_mine && !data.my_interest && data.status === 'open';

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-app-canvas">
      <header
        className="shrink-0 flex items-center gap-3 border-b border-black/5 bg-app-canvas/90 px-4 pb-3 backdrop-blur-lg"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="-ml-1 rounded-full p-1.5 text-app-plum"
        >
          <ArrowLeft size={22} aria-hidden />
        </button>
        <span className="flex-1 text-base font-semibold text-app-plum">Referral</span>
        <button
          type="button"
          onClick={refreshApp}
          aria-label="Refresh"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/55"
        >
          <RefreshCw size={16} aria-hidden />
        </button>
      </header>

      <PullToRefresh className="flex-1 overflow-y-auto overscroll-contain">
        <main
          className="px-4 pt-4"
          style={{
            paddingBottom: showInterestBar
              ? 'calc(7rem + env(safe-area-inset-bottom))'
              : 'calc(2rem + env(safe-area-inset-bottom))',
          }}
        >
          {referral.loading && <Loading label="Loading referral" />}
          {referral.error && <ErrorState message={referral.error} onRetry={referral.reload} />}

          {data && (
            <>
              <article className="rounded-2xl border border-accent bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={data.author?.full_name ?? 'Member'}
                    src={data.author?.avatar_url}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-app-plum">
                      {data.author?.full_name ?? 'Former member'}
                    </p>
                    <p className="text-xs text-app-plum/40">{timeAgo(data.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      data.status === 'open'
                        ? 'bg-accent/8 text-accent'
                        : 'bg-app-plum/5 text-app-plum/45'
                    }`}
                  >
                    {data.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>

                <h1 className="mt-4 text-xl leading-snug font-bold text-app-plum">{data.title}</h1>
                <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-app-plum/70">
                  {data.description}
                </p>

                <dl className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
                  <Detail icon={MapPin} label="Location" value={data.location} />
                  {data.budget && <Detail icon={Wallet} label="Budget" value={data.budget} />}
                  <Detail
                    icon={Handshake}
                    label="Preferred contact"
                    value={
                      data.contact_method.charAt(0).toUpperCase() + data.contact_method.slice(1)
                    }
                  />
                  <Detail
                    icon={Users}
                    label="Interested"
                    value={`${data.interest_count} member${data.interest_count === 1 ? '' : 's'}`}
                  />
                </dl>
              </article>

              {data.my_interest && (
                <section className="mt-3 rounded-2xl border border-accent bg-white p-5">
                  <p className="text-sm leading-relaxed text-app-plum/70">{THANKS}</p>
                  {data.contact?.value ? (
                    <ContactLinks contact={data.contact} />
                  ) : (
                    <p className="mt-3 text-sm text-app-plum/45">
                      {data.contact?.full_name ?? 'The poster'} has not added that contact detail
                      yet.
                    </p>
                  )}
                </section>
              )}

              {data.is_mine && (
                <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-app-plum/50">
                  This is your referral. Interested members appear under{' '}
                  <strong className="font-semibold text-app-plum/70">
                    Interested in your referrals
                  </strong>{' '}
                  on your profile.
                </p>
              )}

              {error && (
                <p role="alert" className="mt-3 text-sm text-accent">
                  {error}
                </p>
              )}
            </>
          )}
        </main>
      </PullToRefresh>

      {showInterestBar && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <button
            type="button"
            onClick={expressInterest}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : (
              <Handshake size={18} aria-hidden />
            )}
            {saving ? 'Sending' : 'Express interest'}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="shrink-0 text-app-plum/35" aria-hidden />
      <dt className="text-app-plum/45">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-right font-medium text-app-plum/75">{value}</dd>
    </div>
  );
}

/** The poster's chosen channel, as a tappable link. */
function ContactLinks({ contact }: { contact: ReferralContact }) {
  const value = contact.value!;

  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <p className="text-sm font-semibold text-app-plum">{contact.full_name}</p>
      <p className="mt-0.5 text-sm text-app-plum/60">{value}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {contact.method === 'email' ? (
          <a
            href={`mailto:${value}`}
            className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
          >
            <Mail size={15} aria-hidden />
            Email
          </a>
        ) : contact.method === 'whatsapp' ? (
          <a
            href={`https://wa.me/${waNumber(value)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
          >
            <MessageCircle size={15} aria-hidden />
            WhatsApp
          </a>
        ) : (
          <a
            href={`tel:${value}`}
            className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
          >
            <Phone size={15} aria-hidden />
            Call
          </a>
        )}
      </div>
    </div>
  );
}

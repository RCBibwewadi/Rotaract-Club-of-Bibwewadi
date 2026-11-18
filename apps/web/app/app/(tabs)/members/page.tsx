"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useResource } from "@/lib/app/client";
import type { MemberProfile } from "@/lib/auth-store";
import {
  Screen,
  Loading,
  ErrorState,
  EmptyState,
  Avatar,
} from "@/components/app/Screen";

export default function MembersPage() {
  const members = useResource<MemberProfile[]>("/api/members");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberProfile | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !members.data) return members.data ?? [];
    return members.data.filter((member) =>
      [member.full_name, member.member_type, member.college_name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle))
    );
  }, [members.data, query]);

  // /api/members returns every approved, active member except the viewer —
  // who is approved too, since the API refuses anyone who is not.
  const total = members.data ? members.data.length + 1 : null;

  return (
    <Screen
      title="Members"
      subtitle={
        total === null ? "The club directory" : `The club directory of ${total}`
      }
    >
      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-app-plum/35"
          aria-hidden
        />
        <label htmlFor="member-search" className="sr-only">
          Search members
        </label>
        <input
          id="member-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="w-full rounded-2xl border border-app-plum/10 bg-white py-3.5 pr-4 pl-11 text-[15px] text-app-plum placeholder-app-plum/30 outline-none focus:border-app-pink"
        />
      </div>

      {members.loading && <Loading label="Loading members" />}
      {members.error && (
        <ErrorState message={members.error} onRetry={members.reload} />
      )}

      {members.data && results.length === 0 && (
        <EmptyState
          title={query ? "No matches" : "No members yet"}
          body={
            query
              ? "Try another name."
              : "Approved members will be listed here."
          }
        />
      )}

      <ul className="space-y-2.5">
        {results.map((member) => {
          const showContact = canShowContact(member);

          return (
            <li
              key={member.member_id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4"
            >
              <button
                type="button"
                onClick={() => setSelected(member)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar
                  name={member.full_name}
                  src={member.avatar_url}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-app-plum">
                    {member.full_name}
                  </p>
                  <p className="truncate text-sm text-app-plum/50">
                    {member.member_type?.split(",").join(" · ") || "Member"}
                  </p>
                </div>
              </button>

              {showContact && (
                <div className="flex shrink-0 gap-1.5">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      aria-label={`Call ${member.full_name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                    >
                      <Phone size={16} aria-hidden />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      aria-label={`Email ${member.full_name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                    >
                      <Mail size={16} aria-hidden />
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {selected && (
        <MemberSheet member={selected} onClose={() => setSelected(null)} />
      )}
    </Screen>
  );
}

// member_visibility is one row per member, so PostgREST embeds it as an object, not an array.
function getVisibility(member: MemberProfile) {
  const v = member.member_visibility;
  return Array.isArray(v) ? v[0] : v;
}

function canShowContact(member: MemberProfile) {
  return Boolean(getVisibility(member)?.show_contact);
}

function MemberSheet({
  member,
  onClose,
}: {
  member: MemberProfile;
  onClose: () => void;
}) {
  const visibility = getVisibility(member);
  const showContact = canShowContact(member);
  const businesses =
    visibility?.show_business_name === false
      ? []
      : (member.businesses ?? []).filter((b) => b.is_visible);
  const professions =
    visibility?.show_profession === false
      ? []
      : (member.professions ?? []).filter((p) => p.is_visible);
  const sinceYear = member.years_in_rcb
    ? new Date().getFullYear() - member.years_in_rcb
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={member.full_name}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-app-plum/40"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <Avatar name={member.full_name} src={member.avatar_url} size={72} />
          <h2 className="mt-3 text-xl font-bold text-app-plum">
            {member.full_name}
          </h2>
          <p className="text-sm text-app-plum/50 capitalize">
            {member.member_type?.split(",").join(" · ") || "Member"}
            {sinceYear ? ` · Since ${sinceYear}` : ""}
          </p>
        </div>

        {member.college_name && (
          <Section title="Education">
            <Row
              icon={GraduationCap}
              primary={member.college_name}
              secondary={member.course}
            />
          </Section>
        )}

        {professions.length > 0 && (
          <Section title="Profession">
            {professions.map((p) => (
              <Row
                key={p.profession_id}
                icon={Briefcase}
                primary={`${p.profession_type}${p.employer ? ` @ ${p.employer}` : ""}`}
                secondary={[
                  p.specialisation,
                  p.years_experience && `${p.years_experience} yrs`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </Section>
        )}

        {businesses.length > 0 && (
          <Section title="Business">
            {businesses.map((b) => (
              <Row
                key={b.business_id}
                icon={Building2}
                primary={b.business_name}
                secondary={[b.designation, b.industry, b.business_city]
                  .filter(Boolean)
                  .join(" · ")}
                href={b.website_url}
              />
            ))}
          </Section>
        )}

        <Section title="Contact">
          {showContact && (member.email || member.phone) ? (
            <>
              {member.email && (
                <Row
                  icon={Mail}
                  primary={member.email}
                  href={`mailto:${member.email}`}
                />
              )}
              {member.phone && (
                <>
                  <Row
                    icon={Phone}
                    primary={member.phone}
                    href={`tel:${member.phone}`}
                  />
                  <Row
                    icon={MessageCircle}
                    primary="WhatsApp"
                    href={`https://wa.me/${member.phone.replace(/\D/g, "")}`}
                  />
                </>
              )}
            </>
          ) : (
            <p className="py-2 text-sm text-app-plum/40">
              This member hasn&apos;t shared contact details yet.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold tracking-wider text-app-plum/40 uppercase">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  primary,
  secondary,
  href,
}: {
  icon: typeof Mail;
  primary: string;
  secondary?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60">
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-app-plum">
          {primary}
        </span>
        {secondary && (
          <span className="block truncate text-sm text-app-plum/50">
            {secondary}
          </span>
        )}
      </span>
    </>
  );
  const className = "flex items-center gap-3 rounded-2xl bg-white p-3";
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

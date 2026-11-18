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
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { useResource } from "@/lib/app/client";
import type { MemberProfile } from "@/lib/auth-store";
import {
  Screen,
  Loading,
  ErrorState,
  EmptyState,
  Avatar,
} from "@/components/app/Screen";

interface BodMember {
  bod_id: string;
  full_name: string;
  designation: string;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  gmail?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  riy_year: string;
}

export default function MembersPage() {
  const [tab, setTab] = useState<"members" | "bod">("members");
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
      <div
        role="tablist"
        aria-label="Directory"
        className="mb-4 flex gap-1 rounded-full bg-app-plum/5 p-1"
      >
        {(["members", "bod"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === option
                ? "bg-white text-app-plum shadow-sm"
                : "text-app-plum/50"
            }`}
          >
            {option === "bod" ? "BOD" : "Members"}
          </button>
        ))}
      </div>

      {tab === "bod" ? (
        <BodList />
      ) : (
        <>
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
        </>
      )}

      {selected && (
        <MemberSheet member={selected} onClose={() => setSelected(null)} />
      )}
    </Screen>
  );
}

// Same data and card layout as the public /board page.
function BodList() {
  const bod = useResource<BodMember[]>("/api/bod/current");

  if (bod.loading) return <Loading label="Loading board" />;
  if (bod.error) return <ErrorState message={bod.error} onRetry={bod.reload} />;
  if (!bod.data?.length)
    return (
      <EmptyState
        title="No board members yet"
        body="The current Board of Directors will be listed here."
      />
    );

  return (
    <>
      <p className="mb-3 text-xs font-semibold tracking-wider text-app-plum/40 uppercase">
        Board of Directors {bod.data[0].riy_year}
      </p>
      <ul className="space-y-4">
        {bod.data.map((member) => (
          <li
            key={member.bod_id}
            className="overflow-hidden rounded-2xl bg-white"
          >
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-accent to-accent-light">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="text-6xl text-white/30">
                  {member.full_name.charAt(0)}
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="mb-1 text-sm font-medium text-accent">
                {member.designation}
              </p>
              <h3 className="text-lg font-semibold text-app-plum">
                {member.full_name}
              </h3>
              {member.description && (
                <p className="mt-2 text-sm leading-relaxed text-app-plum/50">
                  {member.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5">
                {member.instagram_url && (
                  <a
                    href={member.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.full_name} on Instagram`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                  >
                    <FaInstagram size={16} aria-hidden />
                  </a>
                )}
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.full_name} on LinkedIn`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                  >
                    <FaLinkedinIn size={16} aria-hidden />
                  </a>
                )}
                {member.gmail && (
                  <a
                    href={`mailto:${member.gmail}`}
                    aria-label={`Email ${member.full_name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                  >
                    <Mail size={16} aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
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

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Camera,
  Check,
  Eye,
  GraduationCap,
  Handshake,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useAuthStore,
  type Business,
  type MemberVisibility,
  type Profession,
} from '@/lib/auth-store';
import { useRefreshKey } from '@/lib/app/refresh';
import { appFetch, ApiError, useResource } from '@/lib/app/client';
import { Screen, Loading, Avatar } from '@/components/app/Screen';
import { NoticeBanner, type Notice } from '@/components/app/AdminScreen';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';

type MemberForm = {
  full_name: string;
  phone: string;
  dob: string;
  interests: string;
  years_in_rcb: number;
  college_name: string;
  course: string;
  aspiration: string;
};

type BizForm = Omit<Business, 'business_id'>;
type ProfForm = Omit<Profession, 'profession_id'>;

const EMPTY_BIZ: BizForm = {
  business_name: '',
  industry: '',
  designation: '',
  description: '',
  website_url: '',
  business_city: '',
  is_visible: true,
};

const EMPTY_PROF: ProfForm = {
  profession_type: '',
  specialisation: '',
  years_experience: '',
  employer: '',
  is_primary: false,
  is_visible: true,
};

/**
 * Blank optional fields are dropped rather than sent: the API's schemas reject
 * an empty string for a URL, and Postgres rejects one for a date.
 *
 * shortcut: a field cannot be cleared from the app, only overwritten; add an
 * explicit null per field if members ask to erase one.
 */
function filled<T extends Record<string, unknown>>(form: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(form).filter(([, value]) => value !== '' && value !== undefined),
  ) as Partial<T>;
}

/** Members type "rcb.com", which the URL schema rejects. */
function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function ProfilePage() {
  const { member, fetchProfile, logout } = useAuthStore();
  const router = useRouter();
  const revision = useRefreshKey();

  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [memberForm, setMemberForm] = useState<MemberForm | null>(null);
  // null = closed, '' = adding a new one, otherwise the id being edited.
  const [bizId, setBizId] = useState<string | null>(null);
  const [bizForm, setBizForm] = useState<BizForm>(EMPTY_BIZ);
  const [profId, setProfId] = useState<string | null>(null);
  const [profForm, setProfForm] = useState<ProfForm>(EMPTY_PROF);

  const fileInput = useRef<HTMLInputElement>(null);

  // The stored profile can be stale (or absent after a cold start), so refresh
  // it from the same endpoint the website uses.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, revision]);

  const visibility = useResource<MemberVisibility>('/api/visibility/me');

  const say = (text: string, type: 'success' | 'error') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };

  /** Every mutation reports its outcome and leaves the form open on failure. */
  const run = async (action: () => Promise<void>, done: string) => {
    setSaving(true);
    try {
      await action();
      await fetchProfile();
      say(done, 'success');
      return true;
    } catch (err) {
      say(err instanceof ApiError ? err.message : 'Something went wrong', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    router.replace('/app/login');
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { url } = await appFetch<{ url: string }>('/api/upload/avatar', {
        method: 'POST',
        body,
      });
      await appFetch('/api/members/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: url }),
      });
      await fetchProfile();
      say('Photo updated', 'success');
    } catch (err) {
      say(err instanceof ApiError ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const saveMember = async () => {
    if (!memberForm) return;
    if (memberForm.full_name.trim().length < 2) {
      say('Enter your full name', 'error');
      return;
    }
    const ok = await run(
      () =>
        appFetch('/api/members/me', {
          method: 'PATCH',
          body: JSON.stringify(filled({ ...memberForm, full_name: memberForm.full_name.trim() })),
        }),
      'Profile updated',
    );
    if (ok) setMemberForm(null);
  };

  const saveBiz = async () => {
    if (!bizForm.business_name.trim()) {
      say('A business needs a name', 'error');
      return;
    }
    const payload = filled({ ...bizForm, website_url: normaliseUrl(bizForm.website_url ?? '') });
    const ok = await run(
      () =>
        appFetch(bizId ? `/api/businesses/${bizId}` : '/api/businesses', {
          method: bizId ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        }),
      'Business saved',
    );
    if (ok) setBizId(null);
  };

  const saveProf = async () => {
    if (!profForm.profession_type.trim()) {
      say('A profession needs a type', 'error');
      return;
    }
    const ok = await run(
      () =>
        appFetch(profId ? `/api/professions/${profId}` : '/api/professions', {
          method: profId ? 'PATCH' : 'POST',
          body: JSON.stringify(filled(profForm)),
        }),
      'Profession saved',
    );
    if (ok) setProfId(null);
  };

  const remove = (path: string, label: string) => {
    if (!window.confirm(`Remove this ${label}?`)) return;
    void run(() => appFetch(path, { method: 'DELETE' }), `${label} removed`);
  };

  const toggleVisibility = async (key: keyof Omit<MemberVisibility, 'member_id'>) => {
    const current = visibility.data;
    if (!current || saving) return;
    setSaving(true);
    try {
      const next = await appFetch<MemberVisibility>('/api/visibility/me', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: !current[key] }),
      });
      visibility.set(next);
    } catch (err) {
      say(err instanceof ApiError ? err.message : 'Could not save that setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!member) {
    return (
      <Screen title="Profile">
        <Loading label="Loading your profile" />
      </Screen>
    );
  }

  const businesses = member.businesses ?? [];
  const professions = member.professions ?? [];
  const isStudent = member.member_type?.includes('student');

  const contacts = [
    member.email && { icon: Mail, label: member.email, href: `mailto:${member.email}` },
    member.phone && { icon: Phone, label: member.phone, href: `tel:${member.phone}` },
    member.dob && { icon: Calendar, label: `Born ${member.dob}` },
    member.college_name && { icon: GraduationCap, label: member.college_name },
    member.course && { icon: GraduationCap, label: member.course },
    member.aspiration && { icon: Handshake, label: member.aspiration },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href?: string }[];

  return (
    <Screen title="Profile">
      {notice && <NoticeBanner notice={notice} />}

      <section className="flex flex-col items-center rounded-2xl bg-white p-6 text-center">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          aria-label="Change profile photo"
          className="relative rounded-full"
        >
          <Avatar name={member.full_name} src={member.avatar_url} size={84} />
          <span className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-app-pink text-white shadow">
            {uploading ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <Camera size={15} aria-hidden />
            )}
          </span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadAvatar(file);
          }}
        />

        <h2 className="mt-4 text-xl font-bold text-app-plum">{member.full_name}</h2>
        <p className="mt-0.5 text-sm text-app-plum/50">
          {member.member_type?.split(',').join(' · ') || 'Member'}
        </p>
        {member.username && <p className="mt-1 text-xs text-app-plum/35">@{member.username}</p>}
        {(member.years_in_rcb ?? 0) > 0 && (
          <p className="mt-1 text-xs text-app-plum/35">
            {member.years_in_rcb} year{member.years_in_rcb === 1 ? '' : 's'} in RCB
          </p>
        )}
        {member.interests && (
          <p className="mt-3 text-sm leading-relaxed text-app-plum/60">{member.interests}</p>
        )}
      </section>

      {memberForm ? (
        <FormCard
          title="Edit profile"
          saving={saving}
          onSave={saveMember}
          onCancel={() => setMemberForm(null)}
        >
          <Field
            label="Full name"
            value={memberForm.full_name}
            onChange={(v) => setMemberForm({ ...memberForm, full_name: v })}
          />
          <Field
            label="Phone"
            type="tel"
            value={memberForm.phone}
            onChange={(v) => setMemberForm({ ...memberForm, phone: v })}
          />
          <Field
            label="Date of birth"
            type="date"
            value={memberForm.dob}
            onChange={(v) => setMemberForm({ ...memberForm, dob: v })}
          />
          <Field
            label="Years in RCB"
            type="number"
            value={String(memberForm.years_in_rcb)}
            onChange={(v) => setMemberForm({ ...memberForm, years_in_rcb: Number(v) || 0 })}
          />
          <Field
            label="Interests"
            placeholder="Photography, trekking"
            value={memberForm.interests}
            onChange={(v) => setMemberForm({ ...memberForm, interests: v })}
          />
          {isStudent && (
            <>
              <Field
                label="College"
                value={memberForm.college_name}
                onChange={(v) => setMemberForm({ ...memberForm, college_name: v })}
              />
              <Field
                label="Course"
                value={memberForm.course}
                onChange={(v) => setMemberForm({ ...memberForm, course: v })}
              />
              <Field
                label="Aspiration"
                value={memberForm.aspiration}
                onChange={(v) => setMemberForm({ ...memberForm, aspiration: v })}
              />
            </>
          )}
        </FormCard>
      ) : (
        <>
          {contacts.length > 0 && (
            <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
              {contacts.map((row) => {
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

          <button
            type="button"
            onClick={() =>
              setMemberForm({
                full_name: member.full_name,
                phone: member.phone ?? '',
                dob: member.dob ?? '',
                interests: member.interests ?? '',
                years_in_rcb: member.years_in_rcb ?? 0,
                college_name: member.college_name ?? '',
                course: member.course ?? '',
                aspiration: member.aspiration ?? '',
              })
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-app-plum"
          >
            <Pencil size={16} aria-hidden />
            Edit profile
          </button>
        </>
      )}

      <SectionHeader
        icon={Building2}
        title="Business"
        onAdd={
          bizId === null
            ? () => {
                setBizForm(EMPTY_BIZ);
                setBizId('');
              }
            : undefined
        }
      />

      {bizId === '' && (
        <FormCard
          title="New business"
          saving={saving}
          onSave={saveBiz}
          onCancel={() => setBizId(null)}
        >
          <BusinessFields form={bizForm} onChange={setBizForm} />
        </FormCard>
      )}

      {businesses.length === 0 && bizId !== '' && (
        <p className="rounded-2xl bg-white p-4 text-sm text-app-plum/40">
          No business added yet.
        </p>
      )}

      {businesses.map((b) =>
        bizId === b.business_id ? (
          <FormCard
            key={b.business_id}
            title="Edit business"
            saving={saving}
            onSave={saveBiz}
            onCancel={() => setBizId(null)}
          >
            <BusinessFields form={bizForm} onChange={setBizForm} />
          </FormCard>
        ) : (
          <article key={b.business_id} className="mb-3 rounded-2xl bg-white p-4 last:mb-0">
            <RowActions
              title={b.business_name}
              subtitle={[b.designation, b.industry, b.business_city]
                .filter(Boolean)
                .join(' · ')}
              hidden={!b.is_visible}
              onEdit={() => {
                setBizForm({ ...EMPTY_BIZ, ...b });
                setBizId(b.business_id);
              }}
              onDelete={() => remove(`/api/businesses/${b.business_id}`, 'business')}
            />
            {b.description && (
              <p className="mt-2 text-sm leading-relaxed text-app-plum/60">{b.description}</p>
            )}
            {b.website_url && (
              <a
                href={b.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm font-medium text-app-pink"
              >
                {b.website_url}
              </a>
            )}
          </article>
        ),
      )}

      <SectionHeader
        icon={GraduationCap}
        title="Professions"
        onAdd={
          profId === null
            ? () => {
                setProfForm(EMPTY_PROF);
                setProfId('');
              }
            : undefined
        }
      />

      {profId === '' && (
        <FormCard
          title="New profession"
          saving={saving}
          onSave={saveProf}
          onCancel={() => setProfId(null)}
        >
          <ProfessionFields form={profForm} onChange={setProfForm} />
        </FormCard>
      )}

      {professions.length === 0 && profId !== '' && (
        <p className="rounded-2xl bg-white p-4 text-sm text-app-plum/40">
          No profession added yet.
        </p>
      )}

      {professions.map((p) =>
        profId === p.profession_id ? (
          <FormCard
            key={p.profession_id}
            title="Edit profession"
            saving={saving}
            onSave={saveProf}
            onCancel={() => setProfId(null)}
          >
            <ProfessionFields form={profForm} onChange={setProfForm} />
          </FormCard>
        ) : (
          <article key={p.profession_id} className="mb-3 rounded-2xl bg-white p-4 last:mb-0">
            <RowActions
              title={p.profession_type}
              subtitle={[p.specialisation, p.employer, p.years_experience]
                .filter(Boolean)
                .join(' · ')}
              badge={p.is_primary ? 'Primary' : undefined}
              hidden={!p.is_visible}
              onEdit={() => {
                setProfForm({ ...EMPTY_PROF, ...p });
                setProfId(p.profession_id);
              }}
              onDelete={() => remove(`/api/professions/${p.profession_id}`, 'profession')}
            />
          </article>
        ),
      )}

      <SectionHeader icon={Eye} title="Directory visibility" />
      <p className="-mt-1 mb-2 text-xs text-app-plum/40">
        What other members see about you in the directory.
      </p>

      {visibility.loading ? (
        <Loading label="Loading settings" />
      ) : visibility.data ? (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
          <VisibilityRow
            label="Business name"
            on={visibility.data.show_business_name}
            onToggle={() => toggleVisibility('show_business_name')}
          />
          <VisibilityRow
            label="Phone and email"
            on={visibility.data.show_contact}
            onToggle={() => toggleVisibility('show_contact')}
          />
          <VisibilityRow
            label="Profession"
            on={visibility.data.show_profession}
            onToggle={() => toggleVisibility('show_profession')}
          />
          <VisibilityRow
            label="Open to collaborate"
            on={visibility.data.open_to_collab}
            onToggle={() => toggleVisibility('open_to_collab')}
          />
        </ul>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-sm text-app-plum/40">
          {visibility.error ?? 'Settings unavailable.'}
        </p>
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

function SectionHeader({
  icon: Icon,
  title,
  onAdd,
}: {
  icon: typeof Mail;
  title: string;
  onAdd?: () => void;
}) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-app-plum/60">
        <Icon size={16} aria-hidden />
        {title}
      </h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full bg-app-pink/10 px-3 py-1.5 text-xs font-semibold text-app-pink"
        >
          <Plus size={13} aria-hidden />
          Add
        </button>
      )}
    </div>
  );
}

function RowActions({
  title,
  subtitle,
  badge,
  hidden,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  hidden?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-app-plum">
          <span className="truncate">{title}</span>
          {badge && (
            <span className="shrink-0 rounded-full bg-app-pink/10 px-2 py-0.5 text-[10px] font-semibold text-app-pink">
              {badge}
            </span>
          )}
          {hidden && (
            <span className="shrink-0 rounded-full bg-app-plum/5 px-2 py-0.5 text-[10px] font-medium text-app-plum/45">
              Hidden
            </span>
          )}
        </p>
        {subtitle && <p className="mt-0.5 text-sm text-app-plum/50">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className="rounded-full p-2 text-app-plum/40"
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${title}`}
          className="rounded-full p-2 text-accent/60"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function FormCard({
  title,
  saving,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <form
      className="mt-3 rounded-2xl bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) onSave();
      }}
      noValidate
    >
      <h3 className="mb-3 text-sm font-semibold text-app-plum/60">{title}</h3>
      {children}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-app-pink py-3.5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <Check size={16} aria-hidden />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-app-plum/5 px-5 text-[15px] font-medium text-app-plum/60"
        >
          <X size={15} aria-hidden />
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="mb-3 last:mb-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-app-plum/70">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={type === 'number' ? 'numeric' : undefined}
        className={fieldClass}
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mb-3 flex items-center gap-2.5 text-sm text-app-plum/70 last:mb-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4.5 w-4.5 accent-app-pink"
      />
      {label}
    </label>
  );
}

function BusinessFields({
  form,
  onChange,
}: {
  form: BizForm;
  onChange: (form: BizForm) => void;
}) {
  return (
    <>
      <Field
        label="Business name"
        value={form.business_name}
        onChange={(v) => onChange({ ...form, business_name: v })}
      />
      <Field
        label="Industry"
        value={form.industry ?? ''}
        onChange={(v) => onChange({ ...form, industry: v })}
      />
      <Field
        label="Designation"
        value={form.designation ?? ''}
        onChange={(v) => onChange({ ...form, designation: v })}
      />
      <Field
        label="City"
        value={form.business_city ?? ''}
        onChange={(v) => onChange({ ...form, business_city: v })}
      />
      <Field
        label="Website"
        type="url"
        placeholder="rcbpune.com"
        value={form.website_url ?? ''}
        onChange={(v) => onChange({ ...form, website_url: v })}
      />
      <div className="mb-3">
        <label
          htmlFor="biz-description"
          className="mb-1.5 block text-sm font-medium text-app-plum/70"
        >
          Description{' '}
          <span className="font-normal text-app-plum/35">
            ({(form.description ?? '').length}/250)
          </span>
        </label>
        <textarea
          id="biz-description"
          rows={3}
          maxLength={250}
          value={form.description ?? ''}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={`${fieldClass} resize-none`}
        />
      </div>
      <Checkbox
        label="Show in the member directory"
        checked={form.is_visible}
        onChange={(v) => onChange({ ...form, is_visible: v })}
      />
    </>
  );
}

function ProfessionFields({
  form,
  onChange,
}: {
  form: ProfForm;
  onChange: (form: ProfForm) => void;
}) {
  return (
    <>
      <Field
        label="Profession"
        placeholder="Doctor, engineer, CA"
        value={form.profession_type}
        onChange={(v) => onChange({ ...form, profession_type: v })}
      />
      <Field
        label="Specialisation"
        value={form.specialisation ?? ''}
        onChange={(v) => onChange({ ...form, specialisation: v })}
      />
      <Field
        label="Years of experience"
        value={form.years_experience ?? ''}
        onChange={(v) => onChange({ ...form, years_experience: v })}
      />
      <Field
        label="Employer"
        value={form.employer ?? ''}
        onChange={(v) => onChange({ ...form, employer: v })}
      />
      <Checkbox
        label="This is my primary profession"
        checked={form.is_primary}
        onChange={(v) => onChange({ ...form, is_primary: v })}
      />
      <Checkbox
        label="Show in the member directory"
        checked={form.is_visible}
        onChange={(v) => onChange({ ...form, is_visible: v })}
      />
    </>
  );
}

function VisibilityRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="text-[15px] text-app-plum/75">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? 'bg-app-pink' : 'bg-app-plum/15'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            on ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>
    </li>
  );
}

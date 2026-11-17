"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Film,
  ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import { useResource, ApiError } from "@/lib/app/client";
import { adminFetch, getAdminToken } from "@/lib/app/admin";
import { Loading, ErrorState, EmptyState } from "@/components/app/Screen";
import AdminScreen, {
  NoticeBanner,
  useNotice,
} from "@/components/app/AdminScreen";
import MediaField from "@/components/app/MediaField";
import {
  QUESTION_TYPES,
  type PublicRegistrationForm,
  type RegistrationQuestion,
} from "@/lib/registration";

interface AdminForm extends PublicRegistrationForm {
  is_active: boolean;
  registrations?: { count: number }[];
}

interface AdminRegistration {
  registration_id: string;
  form_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  answers: { question_id: string; label: string; value: string | string[] }[];
  payment_status: "not_required" | "submitted" | "verified";
  payment_proof_url: string | null;
  payment_proof_path: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface AdminEvent {
  event_id: string;
  event_name: string;
  event_date: string | null;
}

type FormDraft = Omit<AdminForm, "form_id" | "is_active" | "registrations">;

const EMPTY_DRAFT: FormDraft = {
  title: "",
  description: "",
  offer_title: "",
  offer_description: "",
  image_url: null,
  video_url: null,
  payment_enabled: false,
  payment_amount: null,
  payment_original_amount: null,
  payment_qr_url: null,
  auth_required: false,
  questions: [],
  event_id: null,
};

// Registrations sit behind a second password (REGISTERATION_PASSWORD), sent on
// every call. Same sessionStorage key as the website's admin panel.
const REG_PASSWORD_KEY = "rcb-registration-password";

function regPassword(): string {
  try {
    return sessionStorage.getItem(REG_PASSWORD_KEY) || "";
  } catch {
    return "";
  }
}

// Module scope: useResource needs a stable fetcher.
function regFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return adminFetch<T>(path, {
    ...init,
    headers: { ...init.headers, "X-Registration-Password": regPassword() },
  });
}

const fieldClass =
  "w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum " +
  "placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink";
const labelClass = "mt-4 mb-1.5 block text-sm font-medium text-app-plum/70";

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "No date";

export default function AdminRegistrationsPage() {
  const [unlocked, setUnlocked] = useState(() => regPassword() !== "");

  const lock = () => {
    try {
      sessionStorage.removeItem(REG_PASSWORD_KEY);
    } catch {
      // ignore
    }
    setUnlocked(false);
  };

  return (
    <AdminScreen title="Registrations">
      {unlocked ? (
        <Panel onLock={lock} />
      ) : (
        <Unlock onUnlocked={() => setUnlocked(true)} />
      )}
    </AdminScreen>
  );
}

function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // A plain fetch, not adminFetch: a wrong password is a 403, which adminFetch
  // would read as an expired admin session and sign the admin out.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking || !password) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/registration-forms", {
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
          "X-Registration-Password": password,
        },
      });
      if (res.ok) {
        try {
          sessionStorage.setItem(REG_PASSWORD_KEY, password);
        } catch {
          // Without storage the password cannot be resent; say so.
          setError(
            "This device blocked storage. Try outside private browsing."
          );
          return;
        }
        onUnlocked();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.message || "Incorrect registrations password");
    } catch {
      setError("You appear to be offline. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <ClipboardList size={22} aria-hidden />
      </span>
      <h2 className="mt-3 text-lg font-semibold text-app-plum">
        Registrations are locked
      </h2>
      <p className="mt-1 text-sm text-app-plum/50">
        Enter the registrations password.
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Registrations password"
        aria-label="Registrations password"
        className={`${fieldClass} mt-5`}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-accent">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={checking || !password}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        {checking && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {checking ? "Checking" : "Unlock"}
      </button>
    </form>
  );
}

/** Two sections, as on the website: the forms, and who registered on each. */
function Panel({ onLock }: { onLock: () => void }) {
  const [view, setView] = useState<"forms" | "registered">("forms");

  return (
    <>
      <div
        role="tablist"
        aria-label="Registrations view"
        className="mb-4 flex gap-1 rounded-full bg-app-plum/5 p-1"
      >
        {(
          [
            ["forms", "Forms"],
            ["registered", "Registered"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              view === id
                ? "bg-white text-app-plum shadow-sm"
                : "text-app-plum/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "forms" ? <FormsPanel onLock={onLock} /> : <RegisteredPanel />}
    </>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-accent/5 text-accent",
  submitted: "bg-sky-50 text-sky-700",
  verified: "bg-emerald-50 text-emerald-700",
};

function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        STATUS_STYLES[value] ?? "bg-app-plum/5 text-app-plum/50"
      }`}
    >
      {label ? `${label}: ` : ""}
      {value.replace("_", " ")}
    </span>
  );
}

function RegisteredPanel() {
  const forms = useResource<AdminForm[]>(
    "/api/admin/registration-forms",
    regFetch
  );
  const regs = useResource<AdminRegistration[]>(
    "/api/admin/registrations",
    regFetch
  );
  const [notice, showNotice] = useNotice();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      await regFetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      showNotice(
        action === "approve"
          ? "Registration approved"
          : "Registration rejected",
        "success"
      );
      regs.reload();
    } catch (err) {
      showNotice(
        err instanceof ApiError ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const loading = forms.loading || regs.loading;
  const error = forms.error || regs.error;
  const all = regs.data ?? [];
  const groups = (forms.data ?? [])
    .map((form) => ({
      form,
      people: all.filter((r) => r.form_id === form.form_id),
    }))
    .filter((g) => g.people.length > 0);

  return (
    <>
      <NoticeBanner notice={notice} />

      {loading && <Loading label="Loading registrations" />}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            forms.reload();
            regs.reload();
          }}
        />
      )}
      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title="No registrations yet"
          body="People who register on a form show up here."
        />
      )}

      <div className="space-y-6">
        {groups.map(({ form, people }) => (
          <section key={form.form_id}>
            <h2 className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <span className="truncate text-[15px] font-bold text-app-plum">
                {form.title}
              </span>
              <span className="shrink-0 text-xs text-app-plum/45">
                {people.length} registered
              </span>
            </h2>
            <ul className="space-y-2">
              {people.map((r) => {
                const open = expanded === r.registration_id;
                const isPdf = r.payment_proof_path
                  ?.toLowerCase()
                  .endsWith(".pdf");
                return (
                  <li key={r.registration_id} className="rounded-2xl bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(open ? null : r.registration_id)
                      }
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 p-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-app-plum">
                          {r.full_name || r.email}
                        </p>
                        <p className="truncate text-sm text-app-plum/55">
                          {r.email}
                        </p>
                        <p className="truncate text-xs text-app-plum/40">
                          {[
                            r.phone,
                            new Date(r.created_at).toLocaleString("en-IN"),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-2 flex flex-wrap gap-1.5">
                          <StatusBadge value={r.status} />
                          {r.payment_status !== "not_required" && (
                            <StatusBadge
                              value={r.payment_status}
                              label="Payment"
                            />
                          )}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        aria-hidden
                        className={`mt-1 shrink-0 text-app-plum/35 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>

                    {open && (
                      <div className="space-y-4 border-t border-black/5 p-4">
                        {r.answers.length > 0 && (
                          <dl className="space-y-3">
                            {r.answers.map((a) => (
                              <div key={a.question_id}>
                                <dt className="text-xs text-app-plum/45">
                                  {a.label}
                                </dt>
                                <dd className="text-sm break-words whitespace-pre-line text-app-plum/80">
                                  {(Array.isArray(a.value)
                                    ? a.value.join(", ")
                                    : a.value) || "—"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}

                        {r.payment_proof_url && (
                          <div>
                            <p className="mb-2 text-xs text-app-plum/45">
                              Payment proof
                            </p>
                            {isPdf ? (
                              <a
                                href={r.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-sm font-medium text-accent"
                              >
                                <ExternalLink size={14} aria-hidden /> Open PDF
                              </a>
                            ) : (
                              <a
                                href={r.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={r.payment_proof_url}
                                  alt="Payment proof"
                                  className="max-h-64 rounded-xl"
                                />
                              </a>
                            )}
                          </div>
                        )}

                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busy === r.registration_id}
                              onClick={() =>
                                void act(r.registration_id, "approve")
                              }
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              <Check size={15} aria-hidden /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={busy === r.registration_id}
                              onClick={() =>
                                void act(r.registration_id, "reject")
                              }
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent/10 py-3 text-sm font-semibold text-accent disabled:opacity-50"
                            >
                              <X size={15} aria-hidden /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function FormsPanel({ onLock }: { onLock: () => void }) {
  const forms = useResource<AdminForm[]>(
    "/api/admin/registration-forms",
    regFetch
  );
  const events = useResource<AdminEvent[]>("/api/events", adminFetch);
  const [notice, showNotice] = useNotice();
  const [editor, setEditor] = useState<{ form: AdminForm | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const eventName = (id: string | null | undefined) =>
    events.data?.find((e) => e.event_id === id)?.event_name;

  const run = async (
    id: string,
    action: () => Promise<unknown>,
    done: string
  ) => {
    setBusy(id);
    try {
      await action();
      showNotice(done, "success");
      forms.reload();
    } catch (err) {
      showNotice(
        err instanceof ApiError ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const setLive = (form: AdminForm, live: boolean) =>
    run(
      form.form_id,
      () =>
        regFetch(`/api/admin/registration-forms/${form.form_id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: live }),
        }),
      live ? "Form is now live" : "Form disabled"
    );

  const remove = (form: AdminForm) => {
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`))
      return;
    void run(
      form.form_id,
      () =>
        regFetch(`/api/admin/registration-forms/${form.form_id}`, {
          method: "DELETE",
        }),
      "Form deleted"
    );
  };

  return (
    <>
      <NoticeBanner notice={notice} />

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setEditor({ form: null })}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-light"
        >
          <Plus size={18} aria-hidden />
          New form
        </button>
        <button
          type="button"
          onClick={onLock}
          aria-label="Lock registrations"
          className="flex w-14 items-center justify-center rounded-2xl bg-app-plum/5 text-app-plum/60"
        >
          <Lock size={18} aria-hidden />
        </button>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-app-plum/45">
        One form can be live at a time. Turning a form live switches the others
        off, shows it on the website&apos;s /register page, and adds Register
        Now to its event in the Calendar.
      </p>

      {forms.loading && <Loading label="Loading forms" />}
      {forms.error && (
        <ErrorState message={forms.error} onRetry={forms.reload} />
      )}

      {forms.data?.length === 0 && (
        <EmptyState
          title="No forms"
          body="Create one, link it to an event and turn it live."
        />
      )}

      <ul className="space-y-3">
        {forms.data?.map((form) => (
          <li key={form.form_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] leading-snug font-bold text-app-plum">
                  {form.title}
                </h2>
                {form.event_id && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-app-plum/50">
                    <CalendarDays size={13} aria-hidden />
                    <span className="truncate">
                      {eventName(form.event_id) ?? "Linked event"}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-xs text-app-plum/40">
                  {form.registrations?.[0]?.count ?? 0} registered ·{" "}
                  {form.questions.length} questions
                  {form.payment_enabled && ` · ₹${form.payment_amount}`}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditor({ form })}
                  aria-label={`Edit ${form.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                >
                  <Pencil size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(form)}
                  disabled={busy === form.form_id}
                  aria-label={`Delete ${form.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
              <span className="text-sm font-medium text-app-plum/70">Live</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                aria-label={`${form.title} live`}
                disabled={busy === form.form_id}
                onClick={() => void setLive(form, !form.is_active)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                  form.is_active ? "bg-accent" : "bg-app-plum/15"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    form.is_active ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editor && (
        <FormSheet
          form={editor.form}
          events={events.data ?? []}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null);
            showNotice(message, "success");
            forms.reload();
          }}
        />
      )}
    </>
  );
}

function FormSheet({
  form,
  events,
  onClose,
  onSaved,
}: {
  form: AdminForm | null;
  events: AdminEvent[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  // Extra columns (form_id, counts) ride along; the server's schema strips them.
  const [draft, setDraft] = useState<FormDraft>(() =>
    form ? { ...form, event_id: form.event_id ?? null } : EMPTY_DRAFT
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormDraft>(key: K, value: FormDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const setQ = (i: number, patch: Partial<RegistrationQuestion>) =>
    set(
      "questions",
      draft.questions.map((q, j) => (j === i ? { ...q, ...patch } : q))
    );
  const toAmount = (s: string) => (s === "" ? null : Number(s));

  // Mirrors the website editor; the server's FormSchema has the final say.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const clean: FormDraft = {
      ...draft,
      questions: draft.questions.map((q) => ({
        ...q,
        options: ["dropdown", "checkbox"].includes(q.type)
          ? (q.options || []).map((o) => o.trim()).filter(Boolean)
          : undefined,
      })),
    };
    const problem =
      (!clean.title.trim() || !clean.offer_title.trim()
        ? "Form title and offer card title are required"
        : null) ??
      (clean.questions.some((q) => !q.label.trim())
        ? "Every question needs a label"
        : null) ??
      (clean.questions.some((q) => q.options && q.options.length === 0)
        ? "Dropdown and checkbox questions need at least one option"
        : null) ??
      (clean.payment_enabled && (!clean.payment_amount || !clean.payment_qr_url)
        ? "Payment needs an amount and a QR image"
        : null) ??
      (clean.payment_original_amount &&
      clean.payment_amount &&
      clean.payment_original_amount <= clean.payment_amount
        ? "Original price must be higher than the payment amount"
        : null);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await regFetch(
        form
          ? `/api/admin/registration-forms/${form.form_id}`
          : "/api/admin/registration-forms",
        { method: form ? "PATCH" : "POST", body: JSON.stringify(clean) }
      );
      onSaved(form ? "Form saved" : "Form created");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the form"
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={form ? "Edit form" : "New form"}
    >
      <form
        onSubmit={submit}
        noValidate
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-app-plum">
            {form ? "Edit form" : "New form"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-app-plum/40"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <label htmlFor="reg_event" className={labelClass}>
          Associated event
        </label>
        <select
          id="reg_event"
          value={draft.event_id ?? ""}
          onChange={(e) => set("event_id", e.target.value || null)}
          className={fieldClass}
        >
          <option value="">None</option>
          {events.map((event) => (
            <option key={event.event_id} value={event.event_id}>
              {event.event_name} · {formatDate(event.event_date)}
            </option>
          ))}
        </select>

        <label htmlFor="reg_title" className={labelClass}>
          Form title
        </label>
        <input
          id="reg_title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          className={fieldClass}
        />

        <label htmlFor="reg_description" className={labelClass}>
          Form description
        </label>
        <textarea
          id="reg_description"
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${fieldClass} resize-none`}
        />

        <label htmlFor="reg_offer_title" className={labelClass}>
          Offer card title{" "}
          <span className="font-normal text-app-plum/35">
            (website home page)
          </span>
        </label>
        <input
          id="reg_offer_title"
          value={draft.offer_title}
          onChange={(e) => set("offer_title", e.target.value)}
          className={fieldClass}
        />

        <label htmlFor="reg_offer_description" className={labelClass}>
          Offer card description
        </label>
        <textarea
          id="reg_offer_description"
          rows={2}
          value={draft.offer_description}
          onChange={(e) => set("offer_description", e.target.value)}
          className={`${fieldClass} resize-none`}
        />

        <MediaField
          label="Image"
          icon={ImageIcon}
          accept="image/*"
          folder="avatars"
          value={draft.image_url ?? ""}
          onChange={(url) => set("image_url", url || null)}
        />
        <MediaField
          label="Video"
          icon={Film}
          accept="video/*"
          folder="videos"
          value={draft.video_url ?? ""}
          onChange={(url) => set("video_url", url || null)}
        />

        <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.auth_required}
            onChange={(e) => set("auth_required", e.target.checked)}
            className="h-5 w-5 accent-[#8b1a2b]"
          />
          <span className="text-[15px] text-app-plum/75">
            Login required
            <span className="block text-xs text-app-plum/45">
              Only applies on the website; the app is always signed in.
            </span>
          </span>
        </label>

        <label className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.payment_enabled}
            onChange={(e) => set("payment_enabled", e.target.checked)}
            className="h-5 w-5 accent-[#8b1a2b]"
          />
          <span className="text-[15px] text-app-plum/75">Payment</span>
        </label>

        {draft.payment_enabled && (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="reg_amount" className={labelClass}>
                  Amount (₹)
                </label>
                <input
                  id="reg_amount"
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={draft.payment_amount ?? ""}
                  onChange={(e) =>
                    set("payment_amount", toAmount(e.target.value))
                  }
                  className={fieldClass}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="reg_original" className={labelClass}>
                  Was (₹)
                </label>
                <input
                  id="reg_original"
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={draft.payment_original_amount ?? ""}
                  onChange={(e) =>
                    set("payment_original_amount", toAmount(e.target.value))
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            <MediaField
              label="Payment QR"
              icon={QrCode}
              accept="image/*"
              folder="avatars"
              value={draft.payment_qr_url ?? ""}
              onChange={(url) => set("payment_qr_url", url || null)}
            />
          </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-app-plum/80">Questions</h3>
          <button
            type="button"
            onClick={() =>
              set("questions", [
                ...draft.questions,
                {
                  id: crypto.randomUUID(),
                  label: "",
                  type: "text",
                  required: false,
                },
              ])
            }
            className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            <Plus size={13} aria-hidden />
            Add question
          </button>
        </div>
        <p className="mt-1 text-xs text-app-plum/40">
          Email is always asked. A text question with “name” in its label
          captures names.
        </p>

        {draft.questions.map((q, i) => (
          <div key={q.id} className="mt-3 space-y-2 rounded-2xl bg-white p-3">
            <div className="flex gap-2">
              <input
                value={q.label}
                onChange={(e) => setQ(i, { label: e.target.value })}
                placeholder="Question"
                aria-label={`Question ${i + 1}`}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "questions",
                    draft.questions.filter((_, j) => j !== i)
                  )
                }
                aria-label={`Remove question ${i + 1}`}
                className="shrink-0 px-2 text-app-plum/40"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={q.type}
                onChange={(e) =>
                  setQ(i, {
                    type: e.target.value as RegistrationQuestion["type"],
                  })
                }
                aria-label={`Question ${i + 1} type`}
                className={fieldClass}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex shrink-0 items-center gap-2 text-sm text-app-plum/70">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => setQ(i, { required: e.target.checked })}
                  className="h-4 w-4 accent-[#8b1a2b]"
                />
                Required
              </label>
            </div>
            {(q.type === "dropdown" || q.type === "checkbox") && (
              <textarea
                rows={3}
                value={(q.options || []).join("\n")}
                onChange={(e) =>
                  setQ(i, { options: e.target.value.split("\n") })
                }
                placeholder="One option per line"
                aria-label={`Question ${i + 1} options`}
                className={`${fieldClass} resize-none`}
              />
            )}
          </div>
        ))}

        {error && (
          <p role="alert" className="mt-4 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {saving ? "Saving" : form ? "Save changes" : "Create form"}
        </button>

        <p className="mt-4 text-center text-xs text-app-plum/40">
          See who registered under the Registered section.
        </p>
      </form>
    </div>
  );
}

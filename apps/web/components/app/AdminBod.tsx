"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useResource, ApiError } from "@/lib/app/client";
import { adminFetch } from "@/lib/app/admin";
import {
  Loading,
  ErrorState,
  EmptyState,
  Avatar,
} from "@/components/app/Screen";
import MediaField from "@/components/app/MediaField";

interface BodMember {
  bod_id: string;
  full_name: string;
  designation: string;
  linkedin_url: string | null;
  instagram_url: string | null;
  gmail: string | null;
  avatar_url: string | null;
  description: string | null;
  riy_year: string;
  is_current: boolean;
  sort_order: number;
}

type BodForm = Omit<BodMember, "bod_id">;

const fieldClass =
  "w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum " +
  "placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink";

/**
 * Board of Directors editor. The current board is what members see on the
 * app's BOD tab and the website's /board page.
 */
export default function AdminBod({
  showNotice,
}: {
  showNotice: (text: string, type: "success" | "error") => void;
}) {
  // GET /api/bod is every year, newest first, then by sort order.
  const bod = useResource<BodMember[]>("/api/bod", adminFetch);
  // null = closed, 'new' = adding, otherwise the member being edited.
  const [sheet, setSheet] = useState<"new" | BodMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (member: BodMember) => {
    if (
      !window.confirm(
        `Remove ${member.full_name} (${member.designation}) from the board?`
      )
    )
      return;
    setDeleting(member.bod_id);
    try {
      await adminFetch(`/api/bod/${member.bod_id}`, { method: "DELETE" });
      bod.set((bod.data ?? []).filter((m) => m.bod_id !== member.bod_id));
      showNotice(`${member.full_name} removed`, "success");
    } catch (err) {
      showNotice(
        err instanceof ApiError ? err.message : "Delete failed",
        "error"
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet("new")}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-light"
      >
        <Plus size={18} aria-hidden />
        Add BOD member
      </button>

      {bod.loading && <Loading label="Loading board" />}
      {bod.error && <ErrorState message={bod.error} onRetry={bod.reload} />}

      {bod.data?.length === 0 && (
        <EmptyState
          title="No board members"
          body="Add one and mark it current to show it on the BOD tab."
        />
      )}

      <ul className="space-y-2.5">
        {bod.data?.map((member) => (
          <li
            key={member.bod_id}
            className="flex items-center gap-3 rounded-2xl bg-white p-4"
          >
            <Avatar name={member.full_name} src={member.avatar_url} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-app-plum">
                {member.full_name}
              </p>
              <p className="truncate text-sm text-accent">
                {member.designation}
              </p>
              <p className="mt-0.5 truncate text-xs text-app-plum/40">
                {member.riy_year}
                {member.is_current ? " · Current" : ""} · #{member.sort_order}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setSheet(member)}
                aria-label={`Edit ${member.full_name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/55"
              >
                <Pencil size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => remove(member)}
                disabled={deleting === member.bod_id}
                aria-label={`Delete ${member.full_name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
              >
                {deleting === member.bod_id ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 size={16} aria-hidden />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {sheet && (
        <BodSheet
          member={sheet === "new" ? null : sheet}
          defaultYear={bod.data?.[0]?.riy_year ?? ""}
          onClose={() => setSheet(null)}
          onSaved={() => {
            // Reload rather than splice: a save can change year and sort order.
            bod.reload();
            showNotice(
              sheet === "new" ? "BOD member added" : "BOD member updated",
              "success"
            );
            setSheet(null);
          }}
        />
      )}
    </>
  );
}

/** Adds a BOD member, or edits the one it is given. */
function BodSheet({
  member,
  defaultYear,
  onClose,
  onSaved,
}: {
  member: BodMember | null;
  defaultYear: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BodForm>({
    full_name: member?.full_name ?? "",
    designation: member?.designation ?? "",
    riy_year: member?.riy_year ?? defaultYear,
    avatar_url: member?.avatar_url ?? "",
    instagram_url: member?.instagram_url ?? "",
    linkedin_url: member?.linkedin_url ?? "",
    gmail: member?.gmail ?? "",
    description: member?.description ?? "",
    sort_order: member?.sort_order ?? 0,
    is_current: member?.is_current ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof BodForm>(key: K, value: BodForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (
      !form.full_name?.trim() ||
      !form.designation?.trim() ||
      !form.riy_year?.trim()
    ) {
      setError("Name, designation and RI year are required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // The API validates URLs and the YYYY-YY year; its message is shown as is.
      const body = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() : v,
        ])
      );
      await adminFetch(member ? `/api/bod/${member.bod_id}` : "/api/bod", {
        method: member ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the BOD member"
      );
      setSaving(false);
    }
  };

  const text = (
    key:
      | "full_name"
      | "designation"
      | "riy_year"
      | "instagram_url"
      | "linkedin_url"
      | "gmail",
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <>
      <label
        htmlFor={`bod-${key}`}
        className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70"
      >
        {label}
      </label>
      <input
        id={`bod-${key}`}
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={member ? "Edit BOD member" : "Add BOD member"}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-app-plum">
            {member ? "Edit BOD member" : "Add BOD member"}
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

        {text("full_name", "Full name", "Jane Doe")}
        {text("designation", "Designation", "President, Secretary…")}
        {text("riy_year", "RI year", "2025-26")}

        <MediaField
          label="Photo"
          icon={ImageIcon}
          accept="image/*"
          folder="avatars"
          value={form.avatar_url ?? ""}
          onChange={(url) => set("avatar_url", url)}
        />

        {text(
          "instagram_url",
          "Instagram URL",
          "https://instagram.com/…",
          "url"
        )}
        {text(
          "linkedin_url",
          "LinkedIn URL",
          "https://linkedin.com/in/…",
          "url"
        )}
        {text("gmail", "Email", "name@gmail.com", "email")}

        <label
          htmlFor="bod-description"
          className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70"
        >
          Description
        </label>
        <textarea
          id="bod-description"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          className={`${fieldClass} resize-none`}
        />

        <div className="mt-4 flex items-center gap-4">
          <label className="flex flex-1 items-center gap-2 text-sm font-medium text-app-plum/70">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) => set("is_current", e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Current board
          </label>
          <label
            htmlFor="bod-sort"
            className="text-sm font-medium text-app-plum/70"
          >
            Order
          </label>
          <input
            id="bod-sort"
            type="number"
            inputMode="numeric"
            value={form.sort_order}
            onChange={(e) =>
              set("sort_order", Math.trunc(Number(e.target.value)) || 0)
            }
            className="w-20 rounded-2xl border border-app-plum/10 bg-white px-3 py-2.5 text-[15px] text-app-plum outline-none focus:border-app-pink"
          />
        </div>

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
          {saving ? "Saving" : member ? "Save changes" : "Add member"}
        </button>
      </form>
    </div>
  );
}

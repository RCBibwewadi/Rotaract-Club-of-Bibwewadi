'use client';

import { useState } from 'react';
import { Loader2, X, type LucideIcon } from 'lucide-react';
import { ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';

/**
 * One uploaded file in an admin form: a banner, a video or a payment QR. The
 * upload happens as soon as a file is picked, so the form only ever holds the
 * stored URL.
 */
export default function MediaField({
  label,
  icon: Icon,
  accept,
  folder,
  value,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  accept: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const { url } = await adminFetch<{ url: string }>(`/api/upload?folder=${folder}`, {
        method: 'POST',
        body,
      });
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-sm font-medium text-app-plum/70">{label}</p>

      {value && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3">
          <Icon size={16} className="shrink-0 text-app-plum/40" aria-hidden />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-app-plum/60"
          >
            {value.split('/').pop()}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="shrink-0 text-accent"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-app-plum/20 bg-white py-3.5 text-sm font-medium text-app-plum/60">
        {busy ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Icon size={16} aria-hidden />
        )}
        {busy ? 'Uploading' : value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

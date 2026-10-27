'use client';

import { useEffect, useState } from 'react';
import type { PublicRegistrationForm } from '@/lib/registration';

// One request per page load, shared by the navbar, the offer card and /register.
let request: Promise<PublicRegistrationForm | null> | null = null;

function fetchActive() {
  request ??= fetch('/api/registrations/active')
    .then(r => (r.ok ? r.json() : null))
    .then(d => (d?.data as PublicRegistrationForm | null) ?? null)
    .catch(() => { request = null; return null; });
  return request;
}

/** undefined while loading, null when no form is active. */
export function useActiveRegistration() {
  const [form, setForm] = useState<PublicRegistrationForm | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetchActive().then(f => { if (!cancelled) setForm(f); });
    return () => { cancelled = true; };
  }, []);
  return form;
}

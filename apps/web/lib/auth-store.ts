import { create } from 'zustand';


const AUTH_KEY = 'rcb-auth';

export interface MemberProfile {
  member_id: string;
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
  avatar_url?: string;
  member_type: string;
  years_in_rcb?: number;
  interests?: string;
  dob?: string;
  rid?: string;
  college_name?: string;
  course?: string;
  aspiration?: string;
  businesses?: Business[];
  professions?: Profession[];
  member_visibility?: MemberVisibility[];
}

export interface Business {
  business_id: string;
  business_name: string;
  industry?: string;
  designation?: string;
  description?: string;
  website_url?: string;
  business_city?: string;
  is_visible: boolean;
}

export interface Profession {
  profession_id: string;
  profession_type: string;
  specialisation?: string;
  years_experience?: string;
  employer?: string;
  is_primary: boolean;
  is_visible: boolean;
}

export interface MemberVisibility {
  member_id: string;
  show_business_name: boolean;
  show_contact: boolean;
  show_profession: boolean;
  open_to_collab: boolean;
}

interface AuthState {
  token: string | null;
  member: MemberProfile | null;
  role: string | null;
  _hydrated: boolean;
  /** Set when a 401 ended the session, so the login page can explain why */
  sessionExpired: boolean;

  hydrateAuth: () => void;
  /** Ends the session on a 401. Returns true when it did. */
  handleAuthFailure: (status: number) => boolean;
  clearSessionExpired: () => void;
  /** identifier = username, email or phone */
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  member: null,
  role: null,
  _hydrated: false,
  sessionExpired: false,

  /**
   * A 401 means the token is expired or invalid — the session is over.
   * Drop it rather than keeping a dead token, which leaves pages looking
   * logged in while every request silently fails.
   */
  handleAuthFailure: (status: number) => {
    if (status !== 401) return false;
    if (get().token) {
      set({ token: null, member: null, role: null, sessionExpired: true });
      localStorage.removeItem(AUTH_KEY);
    }
    return true;
  },

  clearSessionExpired: () => set({ sessionExpired: false }),

  hydrateAuth: () => {
    if (get()._hydrated) return;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        set({
          token: stored.token || null,
          member: stored.member || null,
          role: stored.role || null,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },

  login: async (identifier: string, password: string) => {
    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const { token, role } = data.data;
      set({ token, role, sessionExpired: false });

      // Persist
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token, role }));

      // Fetch full profile
      await get().fetchProfile();

      return { success: true, message: data.message || 'Login successful' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await fetch(`/api/members/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const member = data.data;
        set({ member });
        // Update localStorage with member data
        const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...stored, member }));
      } else {
        // 401 ends the session; a 403 (e.g. pending approval) keeps it
        get().handleAuthFailure(res.status);
      }
    } catch {
      // Network error — keep existing state
    }
  },

  logout: () => {
    set({ token: null, member: null, role: null, sessionExpired: false });
    localStorage.removeItem(AUTH_KEY);
  },

  isLoggedIn: () => {
    return get().token !== null;
  },
}));

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

  hydrateAuth: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  member: null,
  role: null,
  _hydrated: false,

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

  login: async (username: string, password: string) => {
    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const { token, role } = data.data;
      set({ token, role });

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
      } else if (res.status === 401 || res.status === 403) {
        // Token expired or not approved yet — keep token but no profile
      }
    } catch {
      // Network error — keep existing state
    }
  },

  logout: () => {
    set({ token: null, member: null, role: null });
    localStorage.removeItem(AUTH_KEY);
  },

  isLoggedIn: () => {
    return get().token !== null;
  },
}));

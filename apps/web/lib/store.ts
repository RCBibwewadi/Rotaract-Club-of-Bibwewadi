import { create } from 'zustand';

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  gradient: string;
  date: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  aboutText: string;
  aboutImage: string;
  visionText: string;
  pillars: { icon: string; title: string; description: string }[];
  stats: { value: string; label: string }[];
  boardMembers: BoardMember[];
  projects: Project[];
  events: EventItem[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: { platform: string; url: string }[];
}

interface AppState {
  isDark: boolean;
  parallaxIntensity: number;
  isAdminLoggedIn: boolean;
  adminPassword: string;
  content: SiteContent;
  toggleDark: () => void;
  setParallaxIntensity: (v: number) => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  updateContent: (content: Partial<SiteContent>) => void;
  fetchContent: () => Promise<void>;
  _contentFetched: boolean;
  addBoardMember: (member: BoardMember) => void;
  removeBoardMember: (id: string) => void;
  updateBoardMember: (id: string, member: Partial<BoardMember>) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  addEvent: (event: EventItem) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, event: Partial<EventItem>) => void;
  _hydrated: boolean;
  hydrateFromStorage: () => void;
}

const defaultContent: SiteContent = {
  heroTitle: 'Rotaract Club of Bibwewadi',
  heroSubtitle: 'Pune',
  heroTagline: 'Make it Matter',
  aboutText: 'The Rotaract Club of Bibwewadi Pune is a vibrant social organization driven by young leaders who believe in creating impact through service, fellowship, and professional growth. Rooted in the values and global spirit of Rotary International, we work at the grassroots level to uplift communities while building lifelong networks and leadership skills among our members.',
  aboutImage: '',
  visionText: 'To be a dynamic force for positive change in society while nurturing responsible leaders of tomorrow — individuals who serve with empathy, act with integrity, and inspire others to do the same.',
  stats: [
    { value: '200+', label: 'Active Members' },
    { value: '50+', label: 'Projects Completed' },
    { value: '100+', label: 'Events Organized' },
    { value: '15+', label: 'Community Partners' },
  ],
  pillars: [
    { icon: '🌱', title: 'Social Service', description: 'Designing and executing initiatives that address real community needs, from education and health to environment and civic awareness.' },
    { icon: '🤝', title: 'Network Building', description: 'Creating a strong, supportive circle of like-minded individuals, mentors, and partners who grow together personally and professionally.' },
    { icon: '🚀', title: 'Leadership Development', description: 'Providing platforms to lead projects, speak with confidence, manage teams, and turn ideas into action.' },
    { icon: '💪', title: 'Community Engagement', description: 'Collaborating with institutions, NGOs, and citizens to multiply impact and foster sustainable change.' },
  ],
  boardMembers: [
    { id: '1', name: 'Rtr. Aarav Sharma', role: 'President', bio: 'Passionate about community development and youth empowerment.', gradient: 'from-orange-500 to-red-500' },
    { id: '2', name: 'Rtr. Priya Deshmukh', role: 'Vice President', bio: 'Driving innovation in social service through technology.', gradient: 'from-blue-500 to-purple-500' },
    { id: '3', name: 'Rtr. Rohan Kulkarni', role: 'Secretary', bio: 'Ensuring smooth operations and effective communication.', gradient: 'from-green-500 to-teal-500' },
    { id: '4', name: 'Rtr. Sneha Patil', role: 'Treasurer', bio: 'Managing finances with transparency and accountability.', gradient: 'from-pink-500 to-rose-500' },
    { id: '5', name: 'Rtr. Vikram Joshi', role: 'Director - Service', bio: 'Leading impactful service projects across the community.', gradient: 'from-amber-500 to-orange-500' },
    { id: '6', name: 'Rtr. Ananya Mehta', role: 'Director - Club Service', bio: 'Building fellowship and strengthening internal bonds.', gradient: 'from-cyan-500 to-blue-500' },
  ],
  projects: [
    { id: '1', title: 'Clean Bibwewadi Drive', category: 'Environment', description: 'Community-wide cleanliness campaign engaging 200+ volunteers.', gradient: 'from-green-400 to-emerald-600', date: '2025-03-15' },
    { id: '2', title: 'Blood Donation Camp', category: 'Health', description: 'Annual blood donation drive collecting 150+ units.', gradient: 'from-red-400 to-rose-600', date: '2025-02-20' },
    { id: '3', title: 'Digital Literacy Workshop', category: 'Education', description: 'Teaching basic computer skills to underprivileged youth.', gradient: 'from-blue-400 to-indigo-600', date: '2025-04-10' },
    { id: '4', title: 'Tree Plantation Drive', category: 'Environment', description: 'Planted 500+ saplings across Bibwewadi locality.', gradient: 'from-lime-400 to-green-600', date: '2025-01-25' },
    { id: '5', title: 'Career Guidance Seminar', category: 'Education', description: 'Guiding students on career paths and opportunities.', gradient: 'from-purple-400 to-violet-600', date: '2025-05-05' },
    { id: '6', title: 'Food Distribution Drive', category: 'Community', description: 'Distributing meals to 300+ families in need.', gradient: 'from-orange-400 to-amber-600', date: '2025-06-01' },
  ],
  events: [
    { id: '1', title: 'Installation Ceremony 2025-26', date: '2025-07-15', time: '6:00 PM', location: 'Hotel Swaroop, Bibwewadi', description: 'Grand installation of the new board of directors.', category: 'Ceremony' },
    { id: '2', title: 'Leadership Summit', date: '2025-08-20', time: '10:00 AM', location: 'Pune Convention Center', description: 'Inter-club leadership development workshop.', category: 'Workshop' },
    { id: '3', title: 'Independence Day Celebration', date: '2025-08-15', time: '8:00 AM', location: 'Bibwewadi Ground', description: 'Flag hoisting and cultural program.', category: 'Celebration' },
    { id: '4', title: 'Health Awareness Camp', date: '2025-09-10', time: '9:00 AM', location: 'Community Hall, Bibwewadi', description: 'Free health checkup and awareness session.', category: 'Service' },
  ],
  contactEmail: 'rotaractbibwewadi@gmail.com',
  contactPhone: '+91 98765 43210',
  contactAddress: 'Bibwewadi, Pune, Maharashtra 411037, India',
  socialLinks: [
    { platform: 'Instagram', url: '#' },
    { platform: 'Facebook', url: '#' },
    { platform: 'LinkedIn', url: '#' },
  ],
};

const STORAGE_KEY = 'rcb-site-data';

function saveToStorage(state: Partial<AppState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isDark: state.isDark,
      parallaxIntensity: state.parallaxIntensity,
      content: state.content,
    }));
  } catch {}
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useStore = create<AppState>((set, get) => ({
  isDark: false,
  parallaxIntensity: 0.5,
  isAdminLoggedIn: false,
  adminPassword: 'rotaract2025',
  content: defaultContent,
  _hydrated: false,
  _contentFetched: false,
  hydrateFromStorage: () => {
    if (get()._hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        set({
          isDark: stored.isDark ?? false,
          parallaxIntensity: stored.parallaxIntensity ?? 0.5,
          content: stored.content ?? defaultContent,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
  toggleDark: () => {
    set(s => ({ isDark: !s.isDark }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  setParallaxIntensity: (v) => {
    set({ parallaxIntensity: v });
    setTimeout(() => saveToStorage(get()), 0);
  },
  loginAdmin: (password) => {
    if (password === get().adminPassword) {
      set({ isAdminLoggedIn: true });
      return true;
    }
    return false;
  },
  logoutAdmin: () => set({ isAdminLoggedIn: false }),
  fetchContent: async () => {
    if (get()._contentFetched) return;
    try {
      const res = await fetch(`${API_URL}/api/content`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        if (d) {
          set(s => ({
            _contentFetched: true,
            content: {
              ...s.content,
              heroTitle: d.hero_title ?? s.content.heroTitle,
              heroSubtitle: d.hero_subtitle ?? s.content.heroSubtitle,
              heroTagline: d.hero_tagline ?? s.content.heroTagline,
              aboutText: d.about_text ?? s.content.aboutText,
              aboutImage: d.about_image ?? s.content.aboutImage,
              visionText: d.vision_text ?? s.content.visionText,
              pillars: d.pillars ?? s.content.pillars,
              stats: d.stats ?? s.content.stats,
              contactEmail: d.contact_email ?? s.content.contactEmail,
              contactPhone: d.contact_phone ?? s.content.contactPhone,
              contactAddress: d.contact_address ?? s.content.contactAddress,
              socialLinks: d.social_links ?? s.content.socialLinks,
            },
          }));
          setTimeout(() => saveToStorage(get()), 0);
        }
      }
    } catch { /* fallback to defaults */ }
  },
  updateContent: (partial) => {
    set(s => ({ content: { ...s.content, ...partial } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  addBoardMember: (member) => {
    set(s => ({ content: { ...s.content, boardMembers: [...s.content.boardMembers, member] } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  removeBoardMember: (id) => {
    set(s => ({ content: { ...s.content, boardMembers: s.content.boardMembers.filter(m => m.id !== id) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  updateBoardMember: (id, partial) => {
    set(s => ({ content: { ...s.content, boardMembers: s.content.boardMembers.map(m => m.id === id ? { ...m, ...partial } : m) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  addProject: (project) => {
    set(s => ({ content: { ...s.content, projects: [...s.content.projects, project] } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  removeProject: (id) => {
    set(s => ({ content: { ...s.content, projects: s.content.projects.filter(p => p.id !== id) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  updateProject: (id, partial) => {
    set(s => ({ content: { ...s.content, projects: s.content.projects.map(p => p.id === id ? { ...p, ...partial } : p) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  addEvent: (event) => {
    set(s => ({ content: { ...s.content, events: [...s.content.events, event] } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  removeEvent: (id) => {
    set(s => ({ content: { ...s.content, events: s.content.events.filter(e => e.id !== id) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
  updateEvent: (id, partial) => {
    set(s => ({ content: { ...s.content, events: s.content.events.map(e => e.id === id ? { ...e, ...partial } : e) } }));
    setTimeout(() => saveToStorage(get()), 0);
  },
}));

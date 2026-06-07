
I need you to build a **modern Rotaract Club website** inside `apps/web/` using the Next.js App Router with the following specifications.

---

## Design System

- **Colors**: Near-black (#0A0A0A) + warm orange accent (#E85D04, #F48C06) + generous whitespace
- **Typography**: Display serif (Instrument Serif) + grotesque body (Inter)
- **Theme**: Light/Dark mode toggle, persisted to localStorage
- **Vibe**: Energetic youth movement — bold type, motion, asymmetric grids

---

## Core Features

### 1. Horizontal Scroll Experience (Desktop)
- On desktop (≥1024px), scrolling down moves content **horizontally** (X-axis)
- Each page is divided into **panels** — scrolling traverses them left-to-right
- Uses sticky container + inflated height technique (each panel = 100vh scroll distance)
- Panel dot indicators at bottom with click-to-navigate
- On mobile (<1024px), falls back to normal vertical scroll

### 2. Immersive Section Portal Effect
- Sections start at 92-93% scale with rounded corners and 30% opacity
- As user scrolls into them, they expand to full scale, corners dissolve, opacity rises
- Creates a "entering a portal/room" depth feel
- Intensity controlled by a parallax slider in admin settings

### 3. Cinematic Page Transitions
- Current page exits: scales down, blurs, fades up (500ms)
- Flash overlay briefly covers screen
- New page enters: scales up, deblurs, fades in (700ms)
- Instant scroll-to-top between transitions

### 4. Full-Screen Navigation Overlay
- Hamburger menu always visible (desktop + mobile)
- Opens immersive black overlay with giant serif nav links
- Links stagger-animate in with hover effects (fade others, arrow on hover)
- Active page indicator, side panel with org info

### 5. Rota Mascot (AI Assistant Widget)
- On first visit to Home, full-screen intro: avatar appears, types "Hi, I'm Rota! 👋" then "Welcome to the RCB Family ✨"
- After intro, minimizes to floating chat bubble (bottom-right)
- Section-aware: as user scrolls to different sections, Rota speaks one-liner hints
- Page-aware: on route change, Rota announces the new page
- Can be minimized/closed
- SVG avatar (no external images needed)

### 6. Admin Dashboard
- Password protected (default: "rotaract2025")
- Tabbed interface: Content / Board / Projects / Events / Settings
- CRUD for board members, projects, events
- Edit hero text, about text, vision, pillars, contact info
- Light/Dark mode toggle, parallax intensity slider
- All changes persist to localStorage

---

## Pages Required

| Route | Page | Panels (Desktop) |
|-------|------|------------------|
| `/` | Home | Hero → Pillars → Vision → Explore → CTA |
| `/about` | About | Hero → Story → Vision → Pillars+Stats |
| `/projects` | Projects | Hero → Filter+Gallery |
| `/events` | Events | Hero → Calendar/List |
| `/board` | Board | Hero → Director Cards |
| `/join` | Join | Hero → Benefits+Form |
| `/contact` | Contact | Hero → Info+Form |
| `/admin` | Admin Dashboard | (no horizontal scroll, separate layout) |

---

## Folder Structure Required
apps/web/
├── app/
│ ├── layout.tsx ← Root layout (html, body, fonts, providers, dark mode)
│ ├── globals.css ← Tailwind + custom CSS
│ │
│ ├── (public)/ ← Route group for public pages
│ │ ├── layout.tsx ← Public layout (Navbar, PageTransition, Footer, Rota)
│ │ ├── page.tsx ← Home
│ │ ├── about/
│ │ │ └── page.tsx
│ │ ├── projects/
│ │ │ └── page.tsx
│ │ ├── events/
│ │ │ └── page.tsx
│ │ ├── board/
│ │ │ └── page.tsx
│ │ ├── join/
│ │ │ └── page.tsx
│ │ └── contact/
│ │ └── page.tsx
│ │
│ └── admin/ ← Admin route group (separate layout)
│ ├── layout.tsx ← Admin layout (no navbar/footer)
│ └── page.tsx
│
├── components/
│ ├── Navbar.tsx
│ ├── Footer.tsx
│ ├── PageTransition.tsx
│ ├── HorizontalScroll.tsx
│ ├── ImmersiveSection.tsx
│ ├── AnimatedSection.tsx
│ ├── Rota.tsx
│ └── RotaAvatar.tsx
│
├── lib/
│ └── store.ts ← Zustand store (content, theme, admin auth)
│
├── hooks/
│ ├── useScrollY.ts
│ └── useInView.ts
│
└── public/
└── (fonts if self-hosting)



---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 4
- **State**: Zustand (persisted to localStorage)
- **Icons**: Lucide React
- **Animations**: CSS transitions + Framer Motion (optional)
- **Fonts**: Google Fonts — Instrument Serif + Inter

---

## Key Implementation Notes

### Next.js Specifics
- All interactive components need `'use client'` directive
- Use `next/link` for navigation (not react-router-dom)
- Use `usePathname()` from `next/navigation` instead of `useLocation()`
- Use `useRouter()` for programmatic navigation
- Root layout.tsx should include `<html>`, `<body>`, metadata, font imports

### HorizontalScroll Component
- Wraps page content, counts children as panels
- Creates outer div with `height: N * 100vh`
- Sticky inner viewport with flex track
- Maps `scrollY` → `translateX` via requestAnimationFrame
- Provides React context (`useIsHorizontal()`) for child components

### ImmersiveSection Component
- Reads progress based on element position (rect.left for horizontal, rect.top for vertical)
- Applies scale, borderRadius, opacity transforms based on eased progress
- Has `flat` prop for hero sections (no portal effect)
- Has `rota` prop for section ID (Rota mascot narration)

### PageTransition Component
- Wraps children, tracks pathname changes
- On route change: exit animation → swap children → scroll to top → enter animation
- Provides flash overlay during transition

### Store Structure
```typescript
interface AppState {
  isDark: boolean;
  parallaxIntensity: number;
  isAdminLoggedIn: boolean;
  content: {
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    aboutText: string;
    visionText: string;
    pillars: { icon: string; title: string; description: string }[];
    boardMembers: BoardMember[];
    projects: Project[];
    events: EventItem[];
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    socialLinks: { platform: string; url: string }[];
  };
  // ... actions
}


Default Content
Hero
Title: "Rotaract Club of Bibwewadi"
Subtitle: "Pune"
Tagline: "Make it Matter"
Pillars
🌱 Social Service — Community initiatives
🤝 Network Building — Professional growth
🚀 Leadership Development — Skills & confidence
💪 Community Engagement — NGO collaborations
Board Members (6 default)
President, Vice President, Secretary, Treasurer, 2 Directors
Each has: name, role, bio, gradient (for placeholder card)
Projects (6 default)
Clean drive, Blood donation, Digital literacy, Tree plantation, Career seminar, Food distribution
Each has: title, category, description, gradient, date
Events (4 default)
Installation ceremony, Leadership summit, Independence Day, Health camp
Each has: title, date, time, location, description, category
Scroll Indicator
Thin 2px accent progress bar at bottom of navbar
Fills left-to-right based on scroll position
Mobile Responsive
Horizontal scroll disabled below 1024px
Hamburger menu expands to full-screen nav
All grids collapse to single column
Touch-friendly buttons and forms
Additional CSS Needed
Wave bar animation for hero music visualizer
Rota bubble pop-in animation
Gradient text utility class
Custom scrollbar styling (accent color)
Please implement this complete website following the folder structure above. Start with the root layout.tsx, then the store, then components, then each page. Ensure all interactive components have 'use client' and use Next.js navigation hooks.
# Member Directory — UI/UX Specification for Agentic AI

## Context

We have a Rotaract Club website built  we need:
- A member auth system ( login / logout) 
- A Navbar with full-screen overlay menu
- An immersive portal-scroll vertical UX with section depth effects
- A Rota mascot chatbot widget (bottom-right corner)
- Dark/Light mode toggle
- Design system: near-black (#0A0A0A) + accent orange (#E85D04/#F48C06) + Inter body + Instrument Serif display headings

---

## Gating Rules

1. **Navbar**: The "Directory" link in both the desktop inline nav and the full-screen overlay menu must **only render if a member is logged in** (`loggedInMemberId !== null`). If not logged in, don't show the link at all — no greyed-out state, just hidden.

2. **Route protection**: On the `/members` page component, if `loggedInMemberId` is `null`, do NOT render the directory. Instead show a full-page "Access Required" gate:
   - Centered vertically on screen
   - Lock icon (from lucide-react) at top, 48px, muted color
   - Heading: "Members Only" in display serif
   - Subtext: "Login with your member account to access the directory, browse businesses, and connect with fellow Rotaractors."
   - Two buttons: "Login" (accent filled, links to `/login`) and "Register" (bordered outline, links to `/register`)
   - This gate page should still have the Navbar and Footer around it (it's within the public layout)

3. **Profile page** (`/profile`): Same gating — already has a "Not Logged In" state, keep that as-is.

4. **Login/Register pages**: If a member is already logged in and visits `/login` or `/register`, redirect them to `/profile` automatically.

---

## Directory Page UI/UX (for logged-in members)

### Page Hero
- Subtle parallax background with accent glow blobs
- Tag line: "Our Network" in accent uppercase tracking
- Title: "Member Directory" with "Directory" in italic gradient text
- Subtitle muted: "Connect with fellow Rotaractors — explore businesses, professions, and grow together."
- NO login/register buttons here anymore (user is already logged in)
- Show a small "Welcome back, {firstName}" greeting with their avatar

### Tab Bar Design

Three tabs in a pill/segmented-control container:
┌─────────────────────────────────────────────────┐
│ [👥 Members (12)] [💼 Business (8)] [🎓 Professions (10)] │
└─────────────────────────────────────────────────┘

text


- Active tab: accent background, white text, subtle shadow
- Inactive tabs: transparent, muted text, hover brightens
- Each tab shows the count in a small badge
- On mobile: tabs should be scrollable horizontally if they overflow, or stack to equal-width

### Search + Filter Bar

Below tabs, a unified search row:
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search members, businesses, professions... │
└──────────────────────────────────────────────────────────┘
[ All ] [ IT Services ] [ Marketing ] [ Finance ] [ Design ] ...

text


- Search input: full-width with icon, rounded-xl, themed border
- Filter chips below: only show on Business and Professions tabs
- Business tab shows business categories as chips
- Professions tab shows industries as chips
- "All" chip is default selected
- Active chip: accent background. Inactive: subtle border

---

### Members Tab

Card grid: 1 col mobile → 2 cols tablet → 3-4 cols desktop

Each member card:
┌──────────────────────────┐
│ [Gradient Avatar] Name │
│ Since 2021│
│ Title at Company │
│ "Bio text snippet..." │
│ │
│ [ 🔗 Connect → ] │
└──────────────────────────┘

text


- Avatar: gradient rounded square with initials (2 letters), taken from `member.gradient`
- Name: semibold, truncate if long
- Join year: tiny muted text
- Profession line: only show if `privacy.showProfession` is true
- Bio: 2-line clamp, muted small text
- Connect button: accent/10 background, accent text, full width at bottom
- Hover: card scales 1.02, subtle accent shadow
- Card background: themed (dark-surface / white), rounded-2xl, border

### Business Tab

Larger cards: 1 col mobile → 2 cols desktop

Each business card:
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓ GRADIENT HEADER BAR ▓▓▓▓▓▓│
│ ▓▓▓▓▓▓▓ [Category Badge] ▓▓▓▓▓▓▓▓│
├──────────────────────────────────────┤
│ Business Name [Avatar] │
│ by Owner Name │
│ │
│ Description text goes here... │
│ │
│ 📍 Address 🌐 website.com │
│ │
│ [████████ Connect → ████████] │
└──────────────────────────────────────┘

text


- Gradient header: uses member's gradient, ~96px tall, dark overlay, category badge in bottom-left
- Business name: display serif, large
- Owner name: small muted "by Name"
- Description: regular size, muted
- Metadata chips: address (MapPin icon) and website (Globe icon) in tiny pill badges
- Connect button: FULL accent background (not outline), white text, full width
- Hover: card lifts with shadow

### Professions Tab

Card grid: 1 col mobile → 2 cols tablet → 3 cols desktop

Each profession card:
┌──────────────────────────┐
│ [Avatar] Name │
│ Job Title (accent)│
│ │
│ 💼 Company │
│ 🎓 Industry · Experience │
│ │
│ [Tag] [Tag] [Tag] [Tag] │
│ │
│ [ 🔗 Connect → ] │
└──────────────────────────┘

text


- Avatar: larger (48px), rounded-xl
- Name: semibold
- Job title: accent color, medium weight
- Company + industry lines: small muted with icons
- Skill tags: small rounded-full pills, accent/10 bg + accent text
- Connect button: accent/10 outline style, full width

---

### Connect Modal

When user clicks "Connect" on any card, a modal appears:

**Layout:**
- Fixed overlay with black/60 backdrop + backdrop-blur
- Centered card, max-width ~400px, rounded-3xl
- Close X button top-right

**Content:**
┌────────────────────────────────────┐
│ [X] │
│ [Gradient Avatar] Name │
│ Title @ Co │
│ │
│ ─── Ways to connect ─── │
│ │
│ [📧 Icon] Email │
│ user@email.com → │
│ │
│ [📞 Icon] Phone │
│ +91 98765... → │
│ │
│ [💬 Icon] WhatsApp │
│ +91 98765... ↗ │
│ │
│ [in Icon] LinkedIn │
│ View Profile ↗ │
│ │
└────────────────────────────────────┘

text


**Critical privacy rule:** Each contact channel ONLY appears if:
  1. The member has provided that info (non-empty string)
  2. AND the member's `privacy.showX` toggle is `true`

If ALL channels are hidden, show an empty state:
- EyeOff icon, muted
- "This member hasn't shared contact details yet."

**Channel card design:**
- Each is a clickable row with: colored icon square (10x10 rounded-xl), label + value, arrow
- Email → `mailto:` link
- Phone → `tel:` link
- WhatsApp → `https://wa.me/{number}` link (strip non-digits)
- LinkedIn → direct URL in new tab
- Hover: border brightens to accent/40

**Modal animation:** Scale up from 0.6 with spring easing (use the existing `rotaBubbleIn` keyframe)

---

### Empty States

If search/filter returns zero results in any tab:
text

  🔍
No results found.
Try a different search.

text


---

### Responsive Behavior

| Breakpoint | Members Grid | Business Grid | Professions Grid |
|------------|-------------|---------------|-----------------|
| Mobile (<640px) | 1 column | 1 column | 1 column |
| Tablet (640-1024px) | 2 columns | 1 column | 2 columns |
| Desktop (1024px+) | 3-4 columns | 2 columns | 3 columns |

- Tab bar: on mobile, tabs should use equal width and smaller text
- Filter chips: horizontally scrollable on mobile
- Search bar: full width always
- Cards: consistent padding (p-5 mobile, p-6 desktop)
- Modal: full-width with padding on mobile, centered max-w-md on desktop

---

### Animations & Interactions

- Cards use `AnimatedSection` with staggered delays (60-100ms per card)
- Business cards alternate `from="left"` and `from="right"` entrance
- Profession cards use default `from="up"`
- Member cards use default `from="up"`
- Tab switching should feel instant (no page reload)
- Filter chip selection should instantly re-filter (client-side)
- Connect modal uses existing `rotaBubbleIn` CSS animation
- Modal backdrop click dismisses it

---

### Rota Mascot Hints

Add these section-aware narrations:
- `members-hero`: "Welcome to our member network! 🌐"
- `members-dir`: "Browse businesses, professions & connect with members! 🤝"

Page-level hint:
- `/members`: "Explore our member network — businesses & professions! 🌐"

---

### Navbar Gating

In the navbar component:
- Read `loggedInMemberId` from `useMemberStore`
- Filter `navLinks` array: only include the "Directory" entry when `loggedInMemberId` is not null
- This applies to BOTH the desktop inline links AND the full-screen overlay menu links
- If logged in, show a small gradient avatar (initials) in the top-right actions area linking to `/profile`
- If not logged in, show a User icon linking to `/login`

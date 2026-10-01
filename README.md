<p align="center">
  <img src="apps/web/public/logo.png" alt="Rotaract Club of Bibwewadi Logo" width="200" />
</p>

# Rotaract Club of Bibwewadi (RCB) - Official Website

The official organizational website for **Rotaract Club of Bibwewadi**, built to streamline club operations including member registration, event management, and PR management.

## About Us

Rotaract Club of Bibwewadi is a community-driven organization under Rotary International, dedicated to service, leadership, and community building. With over 100 years of Rotary's legacy, the club focuses on empowering youth through impactful events, professional networking, and social initiatives across Bibwewadi and beyond.

### What This Platform Handles

- **Member Registration & Management** — New member signups, approval workflows, member profiles, and directory
- **Event Management** — Creating, listing, and managing upcoming and past events with registration tracking
- **PR Management** — FOMO (event highlights), legacy archives, board of directors showcase, and public-facing content
- **Admin Dashboard** — Member approvals, event registrations, reimbursements, and content management
- **Business Directory** — Member professional listings and business profiles

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Monorepo     | Turborepo + pnpm                              |
| Frontend     | Next.js 16, React 19, TypeScript              |
| Styling      | Tailwind CSS 4, Framer Motion                 |
| State        | Zustand                                       |
| Backend      | Next.js API Routes                            |
| Database     | Supabase                                      |
| Auth         | JWT + bcrypt                                  |
| Email        | Resend                                        |
| Deployment   | Vercel                                        |

## Prerequisites

- Node.js >= 22.0.0
- pnpm 10.x

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

---

## For Developers

### Branch Strategy

| Branch Type     | Prefix       | Example                        |
| --------------- | ------------ | ------------------------------ |
| Feature         | `feat/`      | `feat/member-profile-page`     |
| Bug Fix         | `fix/`       | `fix/login-redirect-loop`      |
| Development     | `develop/`   | `develop/event-registration`   |

### `develop` Branch (Staging)

The `develop` branch is the hosted preview/staging environment used **purely for testing**.

**Preview URL:** https://rotaract-club-of-bibwewadi-api.vercel.app/

All feature and fix branches should be merged into `develop` first for testing before going to `main`.

### `main` Branch (Production)

The `main` branch is protected:

- **Direct push is blocked** — all changes must go through a Pull Request
- **2 code reviews are compulsory** before merging
- Always ensure your PR passes all checks before requesting reviews

### Workflow

1. Create a branch from `develop` using the appropriate prefix (`feat/`, `fix/`, `develop/`)
2. Push your changes and open a PR to `develop`
3. Test on the preview URL
4. Once verified, open a PR from `develop` to `main`
5. Get 2 approvals and merge

## Project Structure

```
Rotaract-Club-of-Bibwewadi/
├── apps/
│   └── web/                  # Next.js frontend + API routes
│       ├── app/
│       │   ├── (public)/     # Public pages (home, about, events, etc.)
│       │   ├── admin/        # Admin dashboard
│       │   └── api/          # API routes (auth, events, members, etc.)
│       ├── components/       # Shared UI components
│       └── lib/              # Utilities, store, configs
├── packages/
│   └── shared/               # Shared types and utilities
├── turbo.json
└── package.json
```

## License

ISC

## Author

Pritesh Gadiya

# Task: Set Up PWA in Existing Next.js Repository

Convert my existing Next.js website into an installable Progressive Web App (PWA).

### 1. Inspect first
- Inspect repository structure, Next.js version and routing architecture.
- Identify existing Supabase integration, branding, assets and deployment setup.
- Check for existing PWA configuration.

### 2. Implement PWA
- Configure Web App Manifest with app name, icons, theme and background colours.
- Configure service worker and registration.
- Enable standalone app experience.
- Add offline fallback page.
- Support installation on Android, iOS, Windows and macOS.
- Ensure HTTPS compatibility.

### 3. Caching and security
- Cache appropriate static assets.
- Never cache JWTs, private API responses or sensitive user data.
- Ensure users receive updated versions after deployment.

### 4. Preserve existing architecture
- Keep Next.js frontend and backend.
- Keep Supabase PostgreSQL.
- Keep existing custom JWT authentication.
- Keep the single repository.
- Do not migrate to Supabase Auth.
- Do not create another backend or database.
- Do not redesign existing website pages.

### 5. Prepare for future phases

We will implement these separately:

- Phase 2: Existing login + Google authentication for existing members.
- Phase 3: Reddit-style Ideas feed with voting, comments and Supabase Realtime.

Do not implement either phase now.

### 6. Validate and report
- Test PWA installation and offline fallback.
- Verify mobile responsiveness.
- Verify existing website functionality.
- Run build, lint and type checks.
- Report files changed, dependencies added, deployment requirements and testing results.

**Important:** Inspect first, then implement. Make minimal changes and preserve all existing functionality. Current task is strictly PWA setup.
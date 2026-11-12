# Task: Complete PWA Implementation in Existing Next.js Repository

Implement a production-ready PWA in the existing repository. First inspect the current architecture, manifest, security headers, Service Worker registration and `public/sw.js`. Reuse existing code and avoid unnecessary dependencies or architectural changes.

## Phase 1: Service Worker & Caching
- Implement install, activate, fetch and update lifecycle.
- Cache only safe static assets, icons and offline resources.
- Never cache authenticated HTML, `/api/*`, JWT-authorised responses or Supabase user data.
- Clean up outdated caches.
- Handle Service Worker updates safely.

## Phase 2: Installation Experience
- Support Android, iOS and desktop installation.
- Add a custom Install App button where supported.
- Handle `beforeinstallprompt`.
- Detect installed/standalone mode.
- Provide iOS Add to Home Screen instructions.
- Configure appropriate icons, splash experience and metadata.

## Phase 3: Offline Experience
- Show the existing `/offline` page whenever navigation fails due to connectivity.
- Detect online/offline transitions and update the UI immediately.
- Block all application interactions while offline: no form submissions, CRUD operations or other actions.
- Never expose stale authenticated data.
- Restore normal functionality automatically when connectivity returns.
- Ensure offline fallback assets are available even on the first visit where possible.

## Phase 4: Data Synchronization
- Evaluate which user actions genuinely need offline support.
- For this application, offline access should remain disabled/read-only; do not queue mutations or allow offline data entry.
- Ensure interrupted online requests fail gracefully.
- Prevent duplicate submissions and inconsistent data.
- Revalidate data after reconnection.

## Phase 5: Push Notifications
- Implement browser notification permission flow.
- Create and manage Push API subscriptions.
- Store subscriptions securely against authenticated users in Supabase.
- Implement server-side push delivery using VAPID.
- Handle notification clicks and navigation.
- Support subscription updates and unsubscription.
- Never expose VAPID private keys or service credentials to the client.

## Phase 6: Testing & Production Readiness
- Test Android Chrome, iOS Safari and desktop browsers.
- Test installation, updates, offline navigation, reconnection and authentication.
- Verify no sensitive data is cached or exposed.
- Test notification permission, delivery and clicks.
- Check Lighthouse, manifest validity and Service Worker registration.
- Verify production HTTPS and deployment behaviour.

## Implementation Rules
1. Inspect before modifying.
2. Follow the existing Next.js and Supabase architecture.
3. Preserve existing functionality, authentication and routing.
4. Avoid unnecessary dependencies.
5. Do not introduce mock implementations or pretend features work.
6. Implement in phases, validating each phase before proceeding.
7. Report files changed, implementation decisions, tests performed and remaining limitations.

**Expected outcome:** A production-ready, installable PWA with a secure offline fallback, reliable updates, controlled installation experience and working push notifications, without exposing authenticated data or allowing offline mutations.
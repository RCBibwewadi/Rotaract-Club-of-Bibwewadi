Implement the mobile app flow using the existing project structure and
design system.

1. Entry and Authentication
- After the loading/splash screen, open a Sign in / Sign up
  screen.
- Match this visual direction: deep red hero area and accent, existing club logo centered in the hero, and a large rounded
  off-white form panel overlapping the hero.
- Hero text: "Make it Matter". Form heading: "Welcome back",
  with a short community-focused subtitle.
- Sign-in form: username and password fields, password visibility
  toggle, Forgot password?, prominent pink Log in button, and
  a Join us link to registration.
- Registration should use the website's existing sign-up flow and
  fields. Keep typography bold and clean, inputs spacious with subtle
  borders, rounded corners, and dark plum text.
- The repository already contains the logo: find and reuse that asset.
  Do not create a replacement.
- Authentication requirement: use the same accounts, credentials,
  backend/API, and authentication/session logic as the website. A user
  who can log in on the website must be able to log in to the app with
  the same credentials. Do not create a separate user store or
  hardcode credentials. Reuse existing auth services and handle
  loading, validation, errors, and session persistence.
2. Bottom Navigation
After successful login, show the main app with a fixed bottom navigation
bar containing six items: Ideas · Schedule · Updates · Referrals ·
Members · Profile
- Use simple outline icons above/alongside each label.
- Give the bar a white or softly translucent surface, rounded upper
  corners, and a subtle shadow.
- Inactive items use muted grey; the active item uses a dark icon/text
  and a small dot indicator beneath it.
- Keep all six items readable and evenly spaced on mobile; account for
  device safe areas so content is not hidden behind the bar.
- Preserve the app's existing routes and connect each item to its
  correct screen.

  3. Ideas --- Reddit-style Feed
Make Ideas the default selected tab after login. Build it as a
familiar Reddit-style community feed: - Show a scrollable list of idea
posts, each with author/avatar, time, clear title, short description,
optional image, and relevant topic/tag. - Include upvote and downvote
controls, a visible vote count, and a comments count/action on each
post. - Open a post to view its full content and discussion thread;
allow users to add comments. - Provide a clear Create Idea action
for submitting a new post. - Keep cards clean and easy to scan, with
clear spacing and a mobile-first layout. Use the project's existing
data/API where available; do not use static demo content as the final
implementation.

4. Implementation Notes
- First inspect the repository to identify the app framework, existing
  website authentication, routes, shared components, logo asset, and
  available APIs.
- Reuse existing components and backend logic wherever possible. Avoid
  breaking the website.
- Implement responsive layouts, keyboard-friendly forms, accessible
  labels, and proper loading/empty/error states.
- Match the visual reference's overall composition and color
  hierarchy, but adapt it naturally to the app's screen sizes.
- Finish by testing: splash → login/register → authenticated app →
  bottom-tab navigation → Ideas feed and post interactions.
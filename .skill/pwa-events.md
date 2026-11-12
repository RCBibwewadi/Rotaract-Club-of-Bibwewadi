# Mobile App – Events Page Enhancement

Enhance the existing mobile Events page to match the provided UI reference. Reuse the current repository's design system, color theme, components, database, APIs and admin functionality. Do not rebuild existing modules.

## 1. Events Listing UI

Display events as vertically scrollable cards with:

- A large banner/gradient image area at the top.
- Event category displayed as a pill badge over the banner.
- Event title in bold typography.
- Date and time with calendar icon.
- Venue/location with location icon.
- Registered/attending count with people icon.
- **Register** button at the bottom-right.

Use white rounded cards, subtle shadows, comfortable spacing and the existing app background/theme. Keep the layout mobile-responsive.

## 2. Event Categories

Support these four fixed categories:

1. Community Service
2. Professional Development
3. Club Service
4. International Service

- In the Admin event creation/edit screen, add a required category dropdown with these four options.
- Every event must belong to one category.
- Display the selected category as a badge on its event card.
- Allow users to filter events by category.

**Club Service should be the default selected category** when creating a new event.

## 3. Registration Integration

- Connect the Register button to the existing event registration functionality.
- Show the Register button only when the event's **registration-enabled toggle is ON** in Admin.
- If the toggle is OFF, hide the button completely.
- Respect existing registration limits, duplicate-registration prevention and backend validation.
- Update attending counts dynamically after successful registration.
- Show appropriate registration success, closed and error states.

## 4. Admin Integration

Extend the existing Admin Events module with:

- Category selection (four fixed categories).
- Registration Enabled ON/OFF toggle.
- Preserve existing event fields, image/banner uploads, date, time, venue, capacity and registration management.
- Allow category and registration settings to be edited for existing events.

## 5. Implementation Rules

- Inspect existing Events, Admin and Registration implementations before coding.
- Reuse existing database tables, APIs and authentication wherever possible.
- Only add or modify schema/API fields where necessary.
- Fetch all event information dynamically; no hardcoded demo events.
- Ensure Admin changes immediately reflect in the mobile app.
- Test category creation, filtering, event display, registration toggle ON/OFF and registration flow.

**Important:** This is an enhancement to an existing application. Preserve all working functionality and follow the existing repository architecture and visual theme.
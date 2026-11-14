# Mobile App – Referral Feature Implementation

Implement the complete **Referrals** feature in the mobile app using the existing repository, backend, authentication, APIs and database.

**Important:** Follow the existing app's color theme, typography, components, spacing and bottom navigation. Do not introduce a new design system. Make everything mobile-responsive.

## 1. Referral Listing
- Display all posted referrals as vertically scrollable cards.
- Each card should show category, title, short description, poster's name/avatar, location, budget (if provided), number of interested members and Open status.
- Tapping a card opens its detailed view.
- Details should show full description, location, budget, preferred contact method and poster information.
- Add a prominent **Express Interest** button fixed near the bottom.

## 2. Express Interest
- When a member clicks Express Interest:
  - Register their interest against that referral in the database.
  - Show the referral poster's contact number with a friendly message: **"Thanks for showing interest! Feel free to reach out and connect with the person who posted this referral."**
  - Prevent duplicate interest submissions.
  - Update the interested-member count.
- Retrieve the contact number from the poster's existing profile/contact information. Respect the selected preferred contact method and existing privacy/authentication rules.

## 3. Post a Referral
Create a referral submission screen with these fields:

- Title (required)
- Category (required, selectable dropdown)
- Description / Requirements (required)
- Location (required)
- Budget (optional)
- Preferred Contact: Email / Phone / WhatsApp

Add a **Post Referral** button fixed at the bottom. Validate inputs and save referrals against the logged-in member's ID.

## 4. Profile – Referral Interests
Add a **"Interested in Your Referrals"** section to the logged-in user's Profile page.

- Display people who clicked Express Interest on referrals posted by the logged-in user.
- Show their name, profile picture and the referral title they expressed interest in.
- Allow the referral owner to identify and connect with interested members.
- Keep this data dynamically synced with the database.

## 5. Development Requirements
- Reuse existing member authentication and profile data.
- Implement necessary database tables/relationships, API endpoints and frontend integration.
- Associate referrals and interests with actual member IDs.
- Handle loading, empty, success and error states.
- Ensure users cannot express interest in their own referrals.
- Test the complete flow: Post referral → Browse → View details → Express interest → View interested members in poster's profile.

Do not use hardcoded/demo data. Inspect the existing codebase first and integrate into its current architecture without breaking existing features.
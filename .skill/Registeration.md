# Implement End-to-End Registration Feature

Inspect the existing codebase, Admin Dashboard, home page, authentication flow, Supabase database and Storage, and Resend integration before making changes. Implement the following feature end-to-end, preserving the **existing colors, fonts, typography, and design system**. Reuse existing components and avoid unrelated changes.

## 1. Home Page — Offer Card

Once the home page has finished loading, automatically display the offer card if a registration form is enabled in the admin panel.

The offer card should display:

- Registration form title.
- Offer-card description.
- Uploaded offer image.
- A **Register Now** CTA.

Match the existing website's design and the uploaded offer-card UI reference. Fetch all content dynamically from Supabase; do not hardcode it.

## 2. Admin — Registration Form Configuration

Extend the existing Registrations section. When creating or editing a registration form, include:

- Form title and description.
- Offer-card title and description.
- Image upload and video upload.
- Payment toggle (On/Off).
- Payment amount.
- Payment QR image upload.
- **Authentication required** toggle (On/Off).
- Dynamic question-and-answer fields, allowing the admin to add multiple questions and define each answer's input type, such as text, email, phone, number, dropdown, checkbox, or textarea.

Persist all configuration in Supabase. Store uploaded files in Supabase Storage and their paths in the database. Validate all inputs and uploads.

Only one registration form can be active at a time. Enabling a form must automatically disable the previous one, with the change enforced atomically.

## 3. Offer Card CTA — Authentication Logic

When a visitor clicks **Register Now**:

- If `Authentication Required` is **ON**, redirect them to the existing login page. After successful login, in Navbar show the Register option similar to Exclusivity navbar icon clicking it  redirect them to `/register` so they can complete the registration.
- If it is **OFF**, allow them to open `/register` directly without logging in.

Preserve the intended destination during login. Protect the registration flow according to the selected setting, and enforce this rule on the server as well as in the UI.

## 4. Registration Page — `/register`

Build the registration page dynamically from the currently active form in Supabase.

### Visual design

- At the top, play the admin-uploaded video, if available.
- If no video exists, display the uploaded image instead.
- Create a **parallax scrolling effect**: the image or video remains visually fixed as the background while the question-and-answer form content scrolls over it.
- Keep the form readable, responsive, and consistent with the existing theme. Respect reduced-motion preferences and ensure mobile compatibility.

### Dynamic form fields

Render every question configured by the administrator, using its specified input type. Validate required fields and answer formats on both the client and server. Save responses in a structured format linked to the relevant registration and form.

If no form is active, display a suitable message instead of an empty or broken page.

### Payment

If payment is enabled:

- Display the configured payment amount and uploaded payment QR code.
- Allow the user to upload a payment screenshot as proof.
- Store the screenshot securely in a private Supabase Storage bucket.
- Require payment proof before submission if that is the configured requirement.

If payment is disabled, hide payment details and do not require a payment screenshot.

Include a clear **Submit Registration** button. Validate all fields, prevent duplicate submissions, save the registration and answers to Supabase, and show a success or error message.

## 5. Admin — Registered Users and Approval

In the existing Registered Users tab, group registrations by form and show the registrant's details, submitted answers, payment proof preview, payment status, and approval status.

Provide **Approve** and **Reject** actions.

When an administrator approves a registration:

1. Update the registration's approval status in Supabase.
2. Trigger an approval email to that registrant through Resend.
3. Use the Resend email template ID that I will provide, passing the registrant's name and any other variables required by the template.
4. Ensure the email is sent only after approval succeeds, and avoid duplicate emails if the action is retried.
5. Record the email delivery/send status and handle failures so the administrator can retry without approving the same registration again.

Rejection should update the status accordingly. Do not send the approval email for rejected registrations.

## 6. Supabase and Backend Requirements

Inspect the existing schema first and create only the necessary migrations. Add or extend tables for registration forms, registrations, configurable questions, and submitted answers as appropriate.

- Use Supabase Storage for uploaded media and payment proofs.
- Keep payment proofs private and use authenticated access or signed URLs.
- Apply appropriate Row Level Security (RLS) policies.
- Ensure users cannot access other registrants' personal information.
- Enforce active-form and authentication rules server-side.
- Keep `RESEND_API_KEY` and other secrets server-side only.
- Use the existing authentication and authorization system.
- Preserve the historical registration count if the existing requirement to remove registration records when a form is disabled still applies. Do not accidentally lose counts or expose stale records.

## 7. Implementation and Verification

Implement the complete feature, not just the UI. Run the existing lint, type-check, build, and relevant tests.

Verify:

- The offer card appears after the home page loads when a form is active.
- The CTA follows the authentication toggle.
- Video takes precedence over the fallback image.
- Parallax scrolling works responsively.
- Admin-configured questions render with the correct input types.
- Payment QR and screenshot upload work correctly.
- Registration data and answers persist in Supabase.
- Admin approval triggers the correct Resend template.
- Duplicate approval actions do not send duplicate emails.
- Inactive forms cannot accept submissions.
- Existing site functionality and styling remain unchanged.

Finally, report the files changed, migrations and Storage policies added, environment variables required, tests performed, and any manual Supabase or Resend configuration still needed.

**Important:** Inspect and reuse the current project architecture first. Do not hardcode content, expose secrets, or claim an integration works unless it has been tested.

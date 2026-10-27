# Feature: Admin-Controlled Offer Card Modal

Implement an **admin-controlled promotional Offer Card modal** that appears when a user visits the home page for the first time. Administrators must be able to enable or disable the modal and manage its content and image through a new **Offers** subsection in the existing admin panel.

Before implementing anything, inspect the existing project architecture, admin dashboard, authentication flow, home page, Supabase database schema, and Supabase Storage configuration. Follow the existing conventions and reuse existing utilities and components wherever possible.

## 1. Admin Dashboard — New Offers Subsection

Add a new **Offers** subsection to the existing admin dashboard.

The subsection must allow an authorized administrator to create and manage the offer displayed in the home page modal.

### Admin fields

Provide the following inputs:

1. **Offer Status**
   - An enabled/disabled toggle.
   - Enabled: the offer modal is eligible to appear on the home page.
   - Disabled: the modal must not be displayed to users, even if they have not previously dismissed it.

2. **Offer Header**
   - A text input for the offer's heading.
   - Required when saving an enabled offer.

3. **Offer Description**
   - A textarea for the promotional description.
   - Required when saving an enabled offer.

4. **Original Price**
   - A numeric input representing the actual price before the discount.
   - This price must be displayed with a strikethrough in the modal.
   - Must be a valid positive amount.

5. **Discounted Price**
   - A numeric input representing the promotional price.
   - Display this price prominently.
   - Must be greater than zero and lower than the original price.

6. **Offer Image**
   - An image upload input.
   - Display a preview of the currently uploaded image.
   - Allow the administrator to replace the image with a new one.
   - Validate the file type and size using the project's existing upload conventions.

### Admin experience

- Provide Save Changes and appropriate loading, success and error feedback.
- Load the current offer configuration when the Offers subsection opens.
- Persist the toggle state and all offer fields in Supabase.
- Prevent unauthorized users from creating, updating or deleting offers.
- If an offer is enabled, validate that all required content and the image are present before saving.
- Disabling an offer must not delete its content or image; it should only prevent the modal from appearing.

Use the existing admin authentication and authorization mechanisms. Do not create a separate admin authentication system.

## 2. Database Design

Inspect the current database schema before deciding how to store the offer.

Prefer a single persistent offer configuration record if the product only supports one active offer modal.

Store fields equivalent to:

- `id`
- `is_enabled`
- `header`
- `description`
- `original_price`
- `discounted_price`
- `image_path`
- `created_at`
- `updated_at`

Use the project's existing naming conventions and migration strategy. Do not blindly duplicate existing fields or create unnecessary tables.

The home page must retrieve the currently configured offer from this persistent source. Do not hardcode the offer content in the frontend.

If the project uses Supabase Row Level Security, configure appropriate policies so that public users can only read the fields needed to display the active offer, while only authorized administrators can modify the configuration.

Never expose the Supabase service-role key in client-side code.

## 3. Supabase Storage — Image Replacement and Cleanup

Store the offer image in an appropriate Supabase Storage bucket, following the existing project's storage conventions.

**Important: When an administrator replaces the offer image, delete the previous image from storage and upload the new image. Do not leave obsolete offer images accumulating in the bucket.**

Implement the replacement process safely:

1. Validate the new image.
2. Upload it using a unique storage path.
3. Update the database record to reference the new image.
4. After the database update succeeds, delete the previous image.
5. If the database update fails, clean up the newly uploaded image and preserve the existing configuration.
6. If deletion of the old image fails, report or log the cleanup failure and retry cleanup safely where appropriate.

Do not delete the old image before confirming that the new image has been uploaded and the database successfully references it.

Store the image's storage path in the database rather than unnecessarily storing the image binary or base64 content in a database column.

Avoid deleting unrelated files or images belonging to other features.

If the project uses public image URLs, signed URLs, or a particular image-fetching utility, reuse the established approach.

## 4. Home Page — Offer Modal

Implement the modal on the existing home page only.

### Display behavior

- When a user lands on the home page, check whether an offer is configured and enabled.
- If the offer is enabled and the user has not already dismissed it for the applicable visit or session, display the modal automatically.
- Do not require the user to click a button to open it.
- Display it above the page content with a suitable backdrop.
- Keep it centered within the viewport.
- Give it a high enough stacking order to appear above the navbar and other page content.
- The background page must not scroll while the modal is open.
- The modal must remain fixed relative to the viewport and must not scroll away with the page.
- Add a clearly visible close (`X`) button at the top-right corner.
- Closing the modal must dismiss it without navigating away from the home page.

### Modal content

Render the content dynamically from the administrator's saved configuration:

- Offer image.
- Offer header.
- Offer description.
- Original price, displayed with a strikethrough.
- Discounted price, displayed prominently.

Example layout:

<box background="#E5E5E5" theme="light" radius="xl" padding={3} maxWidth="440px" gap={3}>
  <row justify="end">
    <icon name="x" size="lg" color="#333333"/>
  </row>
  <AsyncImage query="minimal premium fashion product promotional campaign photography neutral studio background" aspectRatio="16:9" width="100%" radius="lg"/>
  <box gap={1} align="center">
    <text color="#666666" size="xs">LIMITED-TIME OFFER</text>
    <title size="xl" color="#171717" textAlign="center">Your Offer Header</title>
    <text color="#555555" textAlign="center" size="sm">Your offer description appears here.</text>
    <row align="center" gap={2}>
      <text color="#777777" lineThrough>₹2,999</text>
      <title size="xl" color="#171717">₹1,999</title>
    </row>
  </box>
</box>

The example is only a layout reference. Do not hardcode its image, copy or prices into the actual application.

### Responsive behavior

- Desktop: use a centered modal with balanced image and content proportions.
- Mobile: fit the modal within the viewport with appropriate padding and scrolling inside the modal if necessary.
- Keep the close button visible and accessible.
- Prevent the modal from extending beyond the viewport.
- Ensure that the image preserves its aspect ratio and does not distort.

Match the existing website's design system, fonts and styling conventions. Do not introduce a new design system for this feature.

## 5. First-Visit and Dismissal Logic

Implement the following behavior carefully:

- On the user's first eligible home page visit, display the enabled offer automatically.
- When the user closes the modal, do not immediately reopen it on every React re-render.
- Remember dismissal for the intended visit/session using the project's existing persistence conventions or a suitable session-based mechanism.
- If the user navigates away and returns during the same session, do not repeatedly interrupt them after they have dismissed the modal.
- If the offer is disabled, never display it.
- If the offer is enabled later, allow eligible users who have not dismissed it in the current session to see it.
- If the offer configuration is still loading, avoid showing an empty modal or placeholder offer.
- If no valid offer exists or the image is unavailable, handle the situation gracefully without breaking the home page.

For this implementation, interpret "first time" as the first eligible visit in a browser session, rather than permanently showing the modal only once for the lifetime of the browser. Use session-scoped dismissal so the offer can appear again in a new session.

Do not add unnecessary authentication requirements. The modal should work for both authenticated and unauthenticated visitors.

## 6. Security and Reliability

- Validate all admin inputs on both the client and server where applicable.
- Ensure that only authorized administrators can modify offer configuration or upload and replace the image.
- Apply appropriate Supabase Storage policies.
- Avoid trusting client-provided storage paths or administrator identifiers.
- Handle network failures and database errors without losing the existing valid offer.
- Do not expose secrets.
- Avoid unnecessary database polling or repeated requests.
- Reuse existing loading, error-handling and notification utilities.

## 7. Strict Scope Restrictions

**Do not change anything unrelated to this feature.**

- Do not redesign the home page.
- Do not modify the existing navbar, footer, `DesignerHero`, or Spotify playlist section.
- Do not change existing authentication, products, orders, user profiles or other admin features.
- Do not modify global styles or shared components unless absolutely necessary.
- Do not refactor unrelated code.
- Do not install additional dependencies unless genuinely required.
- Keep all changes narrowly scoped to the Offers subsection, offer data and storage handling, and the home page modal.

## 8. Implementation and Verification

Implement the feature end-to-end using the existing project stack and conventions.

Verify the following:

1. An authorized admin can configure and enable an offer.
2. The admin can update its header, description, prices and image.
3. Replacing an image removes the old storage object after the new configuration is saved successfully.
4. Enabling the offer makes it eligible to appear on the home page.
5. Disabling it prevents the modal from appearing.
6. The modal appears automatically on the first eligible home page visit in a session.
7. Closing it prevents it from reopening repeatedly during the same session.
8. A new session allows the enabled offer to appear again.
9. The modal remains fixed while the background page is scrolled and locks background scrolling while open.
10. The modal works on desktop and mobile.
11. Invalid input, failed uploads and failed database updates are handled safely.
12. Existing application functionality remains unchanged.

Before finishing, review the final diff and remove unrelated changes.

At completion, report:
- Files created or modified.
- Database migrations or Supabase policy changes made.
- How image replacement and cleanup work.
- How session dismissal works.
- Tests and verification performed.

Do not claim that database migrations, storage policies or deployment changes have been applied unless they have actually been executed and verified.
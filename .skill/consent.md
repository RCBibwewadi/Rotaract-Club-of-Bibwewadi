# Task: Implement Terms & Conditions and DPDP Consent UI on Existing Login & Signup Pages

Act as a senior full-stack developer. Our application already has working Login, Signup, authentication and Supabase database functionality.

Your task is to add a consent section to the existing Login and Signup pages without rebuilding or changing the existing authentication system.

IMPORTANT: Keep the implementation minimal. Do not introduce a new authentication architecture, unnecessary services, dashboards or unrelated features.

## 1. UI Placement

On both existing Login and Signup pages, add the consent section immediately above the existing Login / Sign Up button.

Display this line:

"By continuing, you agree to our Terms & Conditions and acknowledge our Privacy Notice."

UI requirements:
- Underline "Terms & Conditions".
- Underline "Privacy Notice".
- Terms & Conditions should open `/terms-and-conditions`.
- Privacy Notice should open `/privacy-policy`.
- Both pages should be responsive.
- Preserve existing UI styling, typography, colours, spacing and design.
- Do not redesign the existing Login or Signup pages.

Create these pages only if they do not already exist.

## 2. Required Consent Checkbox — Personal Data and Application Services

Display the following checkbox:

"I consent to the collection and processing of my personal information, including my email address and contact number, and the storage and processing of my submitted ideas and AI conversations to provide the application's services, as described in the Privacy Notice."

Requirements:
- This consent is required for the processing purposes explained above.
- It must be unchecked by default when consent is first requested.
- The user must provide consent before completing signup or accessing the application where this processing is necessary.
- Save the user's consent against their existing Supabase authenticated user ID.
- Do not display the same consent request again after valid acceptance.
- If the consent version or processing purposes materially change, request fresh consent where required.

## 3. Optional Consent Checkbox — Future AI Model Training

Display a separate checkbox:

"I voluntarily agree that my submitted ideas, prompts and AI conversations may be used to train and improve our own AI models in the future. I understand that this permission is optional and separate from the storage of my data for providing the application's services."

Requirements:
- This permission must be optional.
- It must be unchecked by default.
- Declining must not prevent signup, login or normal application usage.
- Save the user's explicit choice.
- Remember both acceptance and rejection.
- Do not repeatedly ask the user once a decision has been recorded.
- A missing consent must be treated as no permission for training.
- Users must be able to withdraw this permission through an appropriate existing account support/settings mechanism or privacy request process.

IMPORTANT DISTINCTION:

Users who decline AI training must still be able to:
- Submit ideas.
- Save ideas in Supabase.
- Have their ideas analysed by AI.
- Save AI conversations.
- Access their conversation history.
- Use all normal application features.

However, their ideas and conversations must NEVER be included in our own AI model-training datasets without valid explicit training consent.

Do not confuse AI inference (generating AI responses) with AI model training.

## 4. Consent Persistence

First inspect the existing Supabase schema.

If no suitable consent storage exists, introduce only the minimum necessary database changes.

Store the following information:
- user_id
- personal_data_consent
- ai_training_consent
- consent_version
- accepted_at
- updated_at

Preserve the user's previous optional AI-training decision.

Where appropriate, retain an auditable history of consent acceptance and withdrawal rather than silently overwriting the only record.

Use UTC timestamps and appropriate Supabase RLS policies.

Do not store unnecessary personal information.

## 5. Login Behaviour

For existing users:

1. Authenticate using the existing Supabase authentication implementation.
2. Check the user's required consent status.
3. If valid required consent already exists, do not show that checkbox again.
4. If required consent is missing or outdated, display the required consent interface before granting access to the application.
5. If AI-training consent was previously accepted, remember it.
6. If AI-training consent was previously declined, remember that too.
7. Do not repeatedly prompt users for an already-recorded optional decision.

## 6. Signup Behaviour

For new users:

1. Display both consent checkboxes above the existing Signup button.
2. Validate the required consent before proceeding.
3. Allow users to leave AI-training consent unchecked.
4. Create the account using the existing Supabase authentication flow.
5. Save the required consent and the optional training decision.
6. Ensure consent records are associated with the correct authenticated user ID.
7. Handle database failures safely. Do not silently treat a failed consent write as successful consent.

## 7. Future AI Training Protection

Although we are not currently training our own AI model, we plan to do so in the future.

Prepare the consent data so that the future training pipeline can reliably distinguish between:

- Users who accepted AI training.
- Users who declined AI training.
- Users who withdrew AI training consent.
- Users who have never provided an AI-training decision.

Training eligibility must require explicit, current, valid AI-training consent.

Never automatically use all records stored in Supabase for training.

The future training pipeline must exclude:
- Users who declined training.
- Users who never provided training consent.
- Users who withdrew consent.
- Records that cannot be reliably associated with valid consent.

Do not implement a model-training pipeline now. Only implement and persist the consent information.

## 8. Terms & Conditions and Privacy Notice Pages

Create or update:

- `/terms-and-conditions`
- `/privacy-policy`

Use the approved legal draft provided separately.

The Privacy Notice should clearly explain:
- What personal information is collected.
- Why email addresses and contact numbers are collected.
- Why ideas and conversations are stored.
- How AI processing works.
- The distinction between AI inference and AI model training.
- That model-training consent is optional.
- How users can withdraw consent.
- Data retention and deletion practices.
- Relevant third-party service providers.
- How users can raise privacy grievances and exercise their rights.

Do not invent legal entity names, contact details, retention periods or service providers. Use placeholders for missing information.

## 9. Testing and Acceptance Criteria

Verify the following scenarios:

1. New user accepts both permissions and successfully signs up.
2. New user accepts required consent but declines AI training and successfully signs up.
3. User cannot complete signup without required consent.
4. Existing user with valid consent does not see the same required checkbox again.
5. Existing user with missing required consent is prompted.
6. Previously accepted AI-training consent remains accepted.
7. Previously declined AI-training consent remains declined.
8. Users declining training can still save ideas and AI conversations.
9. No user without explicit training consent is eligible for future training.
10. Consent records are protected by Supabase RLS.
11. Terms & Conditions and Privacy Notice links work.
12. Existing login/signup functionality remains unaffected.

## 10. Implementation Constraints

Before making changes:
- Inspect the existing Login and Signup components.
- Inspect the Supabase schema.
- Identify the existing authentication flow.
- Identify the existing idea and conversation storage tables.
- Identify the minimum files requiring changes.

Then implement only the requested scope.

Do not:
- Rebuild authentication.
- Introduce a new backend.
- Create a privacy dashboard.
- Implement AI model training.
- Change existing application features.
- Make AI-training consent mandatory.
- Delete ideas or conversations simply because users decline training.
- Claim legal compliance solely because consent checkboxes exist.

After implementation, provide:
1. Files modified.
2. Database changes and migrations.
3. Consent behaviour implemented.
4. RLS policies added or updated.
5. Tests performed.
6. Any remaining configuration or legal requirements.

The final result should be a simple, consistent consent experience on our existing Login and Signup pages with reliable consent persistence and clear separation between application data storage and future AI model training.
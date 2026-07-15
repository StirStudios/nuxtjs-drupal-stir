# Validation Architecture

This layer uses Yup for client-side validation with two intentionally different flows.

## 1) Dynamic Drupal Webforms

- Entry points:
  - `layers/webform/app/components/global/Paragraph/Webform.vue`
  - `layers/theme/app/utils/buildYupSchema.ts`
- Purpose:
  - Build Yup schemas at runtime from Drupal webform metadata and field states.
- Notes:
  - Handles visibility/conditional logic from Drupal definitions.
  - Optimized for reusable content-driven forms where fields vary per webform.
  - Forms remain server-rendered, then hydrate when their paragraph becomes
    visible. Field renderers remain async code-split so only field types used by
    that form are loaded after hydration.

## 2) Explicit Auth and Account Forms

- Entry points:
  - `layers/auth/app/utils/authValidation.ts`
  - `layers/auth/app/composables/auth/*`
  - `layers/auth/app/pages/account/settings.vue`
- Purpose:
  - Use explicit, stable Yup schemas for login, register, password reset, and account password change.
- Notes:
  - Password policy is centralized in `authValidation.ts`.
  - Route-token checks (for reset links) are validated in composables in addition to Yup field checks.

## Shared Yup Error Mapping

- Utility: `layers/auth/app/utils/yupValidation.ts`
- Purpose:
  - Normalize `ValidationError` objects into Nuxt UI field errors (`{ name, message }[]`).
  - Reused by auth and account flows to keep error behavior consistent.

## Source of Truth

- Client validation improves UX only.
- Drupal remains the authoritative validator on submit for all forms.

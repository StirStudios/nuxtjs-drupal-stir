# Six-month compliance review

Run this review on the `nextReview` date in `compliance/site.json`, every six
months afterward, and whenever a change adds a form, vendor, tracker, embed,
payment flow, account feature, user content, or browser storage.

## Codex task

Audit this repository, its Drupal content, and the production domain declared
in `compliance/site.json`. Treat that file as the verified technology and review
inventory. Run `pnpm audit:compliance`, `pnpm test:a11y`, and the project's normal
verification suite. Inspect forms, cookies, browser storage, analytics,
marketing tags, embeds, booking or payment services, and the public legal pages.
Compare observed behavior with the Drupal Privacy Policy, Terms of Service,
Accessibility Statement, footer menu links, metadata, and consent configuration.
Research material legal or platform changes using current authoritative sources.
Produce a dated report separating verified facts, recommended Drupal edits,
questions for the business owner, and items requiring counsel. Draft supported
changes, but do not publish or deploy legal changes without human approval.

## Human confirmations

- Confirm the legal operator, trade names, public contact details, and domain.
- Confirm every form, data use, retention practice, and third-party service.
- Confirm whether inquiry data is used for email, text, or other marketing.
- Review material legal changes with qualified counsel before publication.

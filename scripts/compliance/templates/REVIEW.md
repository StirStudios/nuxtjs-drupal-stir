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

## Required service discovery

<!-- stir-compliance-discovery:v1 -->

Do not rely on the existing inventory alone. Rebuild it from four sources and
reconcile every difference before approving the review:

1. Query active Drupal content for embedded paragraph and block types, including
   schedulers, maps, video, forms, payments, social feeds, and external scripts.
2. Inspect enabled Drupal modules, Webform handlers, and exported configuration
   for security, CAPTCHA, email, analytics, storage, and account services.
3. Inspect Nuxt app configuration and environment-variable names for enabled
   analytics, accessibility widgets, consent tools, authentication, and vendors.
4. Visit every public route and protected entry route, recording third-party
   scripts, frames, requests, cookies, and browser storage that actually load.

Compare the discovered list with `compliance/site.json` and the published legal
pages. A service that is configured but unused should be recorded as inactive;
an active service must appear in both the inventory and the relevant disclosure.

## Required accessibility review

<!-- stir-compliance-accessibility:v1 -->

Maintain `accessibility.auditRoutes` in `compliance/site.json` as the smallest
representative set that covers every distinct page template and critical flow,
including forms, authentication, dialogs, menus, legal pages, and any embed.
Run `pnpm test:a11y`; it reads this route list automatically. Mark reusable
controls with `data-a11y-scan-hover` or `data-a11y-scan-click` when their opened
or active state needs a separate automated scan.

Automated results are only one part of approval. On the declared routes, verify:

- complete keyboard operation, visible focus, logical order, Escape behavior,
  and focus restoration after closing overlays;
- text resizing to 200%, reflow at 320 CSS pixels (approximately 400% zoom),
  reduced motion, and forced-colors or equivalent high-contrast behavior;
- accessible names, roles, states, error handling, and status announcements;
- one representative flow with a screen reader; and
- Drupal-authored headings, links, alternative text, tables, and form help.

Record the date, reviewer, routes and states checked, findings, fixes, and any
remaining limitation in this project file. Fix contrast at the narrowest
component or interaction state. Do not broadly change primary, semantic, or
brand color tokens unless every affected use has been visually and accessibly
reviewed.

## Human confirmations

- Confirm the legal operator, trade names, public contact details, and domain.
- Confirm every form, data use, retention practice, and third-party service.
- Confirm whether inquiry data is used for email, text, or other marketing.
- Review material legal changes with qualified counsel before publication.

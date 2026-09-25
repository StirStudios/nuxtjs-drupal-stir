# Six-month compliance review

Run this review on the `nextReview` date in `compliance/site.json`, every six
months afterward, and whenever a change adds a form, vendor, tracker, embed,
payment flow, account feature, user content, or browser storage.

## Agent task

Audit this repository, its Drupal content, and the production domain declared
in `compliance/site.json`. Treat that file as the verified technology and review
inventory. Run `pnpm audit:compliance`, `pnpm audit:seo`, `pnpm test:a11y`, and
the project's normal verification suite. Inspect forms, cookies, browser storage, analytics,
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

## Required SEO review

<!-- stir-compliance-seo:v1 -->

Run `pnpm audit:seo` against the public or local frontend origin. It crawls the
public sitemap plus configured representative routes and checks response status,
links, images, titles, descriptions, canonical URLs, robots directives, h1s,
image alt attributes, and JSON-LD syntax. Reconcile blocking findings in Drupal
or the owning Nuxt layer; review warnings for unavailable third-party links.

Automation validates technical consistency, not search rankings or editorial
quality. Confirm that page titles, descriptions, link text, image alternatives,
and structured data accurately describe the visible content.

## Tracked legal copy

<!-- stir-compliance-legal-source:v1 -->

Keep the approved Privacy Policy, Terms of Service, and Accessibility Statement
text in the Drupal project's `compliance/legal/` directory, one HTML file per
page named after its URL alias (for example `privacy-policy.html`). Drupal still
publishes the pages; these files are the reviewed, version-controlled copy.

Preview an approved edit, then apply it through the owning Drupal node:

```sh
ddev drush stir-tools:compliance-content
ddev drush stir-tools:compliance-content --apply
```

The command replaces only the text of a page's single Text paragraph, or its
body when the page has no sections, in a new revision. It never creates pages or
changes layout. `pnpm audit:compliance` reads the same files to confirm that
every service it discovers is declared and disclosed; record a service that is
installed but unused under `technology.inactive` with the reason.

Record each review in a dated `compliance/AUDIT-YYYY-MM-DD.md` report. Update
`review.lastReviewed` and `review.nextReview` only after the technical review and
any required owner or counsel approval are complete.

## Owner questionnaire

<!-- stir-compliance-owner:v1 -->

Code and the live site cannot answer these. Ask the business owner every
question at each review, and record each answer, who gave it, and the date in
the dated audit report. Do not infer an answer; an unanswered question stays an
open finding, and legal copy must not state the unconfirmed fact.

Business and contact

1. What is the legal entity name, any trade names (d/b/a), and the public postal
   address for notices?
2. Where are customers or clients located? Are any outside the United States?
3. Which provider hosts the mailboxes that receive form and customer email, who
   can read them, and how long are messages kept?

Data use and providers

4. Is form, account, or customer data used for marketing, added to a mailing
   list or CRM, or shared outside the business?
5. Which tools outside this repository receive that data, such as a CRM,
   spreadsheet, automation, support desk, accounting, or mailing tool?
6. Which services are self-hosted, and who operates them?
7. May the legal copy name each provider?
8. May test data and personal data that is no longer needed, such as stored
   submitter IP addresses, be deleted?

Accounts and payments (when the site has them)

9. Who can create an account, and is the audience likely to include children or
   teenagers?
10. How do trials, renewals, refunds, and cancellation work in practice?

Accessibility

11. Which manual checks have been completed (keyboard, screen reader, zoom), by
    whom, and when?
12. Do video and audio have captions or transcripts?
13. What response time can be promised for accessibility requests, and what
    limitations are known?

Legal

14. Which state or country's law governs the terms, and has counsel reviewed the
    legal copy?

## Human confirmations

- Review material legal changes with qualified counsel before publication.

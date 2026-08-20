# Downstream compliance

Drupal is the single source of truth for legal and accessibility content. Use
standard published Drupal pages so aliases, revisions, Metatag output, JSON:API,
and menu links all follow the normal content workflow. Nuxt must not duplicate
policy content or define competing routes.

The shared package provides a small compliance inventory and audit command. It
does not generate legal claims, replace accessibility testing, or publish
agent-generated edits.

## Adopt it

1. Create or reuse Drupal Basic Pages for Privacy Policy, Terms of Service, and
   Accessibility Statement.
2. Add those Drupal nodes to the footer menu and give them stable URL aliases.
3. Use native Drupal text components; do not embed a policy vendor.
4. Run `pnpm exec stir-compliance-init` in the downstream Nuxt repository. It
   creates generic `compliance/site.json` and `compliance/REVIEW.md` starters
   without overwriting existing files. Replace every `REPLACE_*` value with a
   verified project fact.
5. Add `"audit:compliance": "stir-compliance"` to downstream scripts and run it
   in CI and during each review.

The audit validates the inventory, review schedule, Drupal page contract,
consent rationale, and common tracker references. Set `COMPLIANCE_SITE_URL` to
also verify that public pages resolve and no longer contain Enzuzo or UserWay
claims.

```sh
COMPLIANCE_SITE_URL=https://www.example.com pnpm audit:compliance
```

Standard cookieless Plausible Analytics alone normally does not require a
cookie-consent prompt. Enable consent UI only when the actual technology and
applicable rules require a choice.

## Six-month review

Use this scheduled task in each downstream repository:

> Audit this repository, its Drupal content, and its production website using
> compliance/site.json as the verified inventory, but do not rely on that
> inventory alone. Query active Drupal content and blocks; inspect enabled
> modules, Webform handlers, exported configuration, Nuxt app configuration,
> and environment integration names; then visit every public route and protected
> entry route to record third-party scripts, frames, requests, cookies, and
> browser storage. Reconcile every difference before approval. Run pnpm
> audit:compliance and the accessibility checks. Compare
> observed behavior with the Drupal Privacy Policy, Terms of Service,
> Accessibility Statement, menu links, metadata, and consent configuration.
> Research material legal or platform changes using current authoritative
> sources. Report verified facts, recommended Drupal edits, owner questions,
> and items requiring counsel separately. Draft changes when supported, but do
> not publish or deploy legal changes without human approval.

Existing consumers should rerun `pnpm exec stir-compliance-init` after upgrading.
The command preserves project-specific content while installing versioned review
checklist additions. `pnpm audit:compliance` reports an error when that checklist
is outdated.

Also run the review whenever a change adds a form, vendor, tracker, embed,
payment flow, account feature, user content, or browser storage.

The templates are intentionally generic. Business identity, forms, vendors,
retention, consent rationale, review dates, and public URLs always belong to the
downstream project and must never be copied from another client.

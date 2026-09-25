---
name: "code-audit"
description: "Use when reviewing, auditing, or evaluating existing code for quality, simplification, or best-practices compliance in this codebase — e.g. \"audit this layer,\" \"review this for best practices,\" \"can we simplify this.\" Not for writing new features, fixing bugs, or making changes."
---

# Code Audit Rubric

Check `ARCHITECTURE.md` first if it exists — some patterns that look
unconventional are documented, intentional decisions, not problems.

Evaluate against each of these. Report findings only — never edit code
during an audit pass.

1. **Simplify** — less code, fewer abstractions, same behavior?
2. **Reuse** — does existing project code already do this?
3. **Drupal 11 conventions** — follows current Drupal backend practice?
4. **Nuxt 4 conventions** — follows current Nuxt frontend practice?
5. **Framework-first** — built-in Nuxt/Nuxt UI/Drupal CE capability
   available before custom code?
6. **Size/perf** — run `pnpm perf:report` and cite its actual numbers;
   don't guess at performance.
7. **VueUse/tooling** — existing composable or utility replaces
   hand-rolled logic?
8. **Right pattern** — consistent with the approach used elsewhere in
   this codebase?

If unsure whether something reflects *current* Drupal 11 or Nuxt 4 best
practice, say so explicitly rather than asserting confidently —
conventions shift and training data can lag.

## Output

Per file/module: a findings list, each tagged with its criterion number,
plus impact (high/med/low) and effort (small/med/large) — so items can
be prioritized, not just listed.

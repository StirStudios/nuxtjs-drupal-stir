---
name: stir-accessibility
description: Implement, review, or test accessibility for Stir Drupal 11 and Nuxt 4 sites against WCAG 2.2 AA. Use for components, navigation, forms, Webforms, dialogs, menus, media, animation, color, focus, keyboard behavior, screen-reader output, Drupal-authored content, accessibility regressions, audits, or automated axe/Playwright checks.
---

# Stir Accessibility

Target WCAG 2.2 AA and inclusive real-world use. Combine automation with keyboard, focus, screen-reader-oriented and content checks; automated success never proves conformance.

## Establish scope

1. Read the repository `AGENTS.md` and frontend or Drupal skills relevant to the change.
2. Identify affected routes, components, breakpoints, states, content types, languages, input methods and assistive-technology interactions.
3. Inspect Drupal authoring constraints as well as Nuxt rendering. Prevent inaccessible content at the source where practical.
4. Read [current-sources.md](references/current-sources.md) for normative and framework guidance.

## Build semantic experiences

- Prefer native HTML semantics and Nuxt UI accessible primitives. Add ARIA only when native semantics cannot express the interaction.
- Preserve heading hierarchy, landmarks, lists, tables, labels, names, roles, values and meaningful link/button text.
- Use real links for navigation and buttons for actions. Keep keyboard behavior consistent with the chosen widget pattern.
- Provide visible focus, logical focus order, skip navigation and a focusable main region.
- Announce client-side route changes and move focus deliberately when context changes. Restore focus after dialogs and overlays close.
- Keep touch targets, spacing and focus indicators usable at zoom and small viewports. Do not trap orientation or require precision gestures.
- Associate form labels, instructions, required state and errors programmatically. Preserve entered values, focus the error summary or first invalid field intentionally, and make async status perceivable.
- Supply truthful alt text or mark decorative images appropriately. Provide captions/transcripts and accessible controls for meaningful audio/video.
- Respect `prefers-reduced-motion`; provide alternatives for dragging, motion, hover-only and time-limited interactions.
- Meet contrast without using color alone. Verify forced colors, dark mode and user text/zoom settings where applicable.
- Keep hidden content out of the accessibility tree and focus order. Do not use positive `tabindex`.

## Cover decoupled risks

- Preserve semantics when Drupal fields and Custom Elements become Vue components.
- Sanitize authored markup without stripping required semantic relationships.
- Make editor controls and help text support accessible content entry, including meaningful media alternatives and link text.
- Ensure SSR contains essential structure, names and status content; hydration must not replace it with a conflicting tree.
- Treat authenticated flows, Webforms, validation, search/filtering, carousels, menus, dialogs and media players as high-risk interactions.

## Verify

1. Run existing Playwright/axe checks on representative routes and every changed interactive state.
2. Test keyboard-only operation: skip link, navigation, focus order, activation, escape/close, focus restoration, forms and errors.
3. Inspect the accessibility tree for names, roles, states, relationships and live announcements.
4. Test at 200% zoom and responsive reflow; check target sizes, focus visibility and content loss.
5. Test reduced motion and, when relevant, high contrast/forced colors.
6. Check Drupal-authored examples including missing/long content, media alternatives, rich text, tables and link text.
7. Test one practical screen-reader flow for high-risk changes when the environment permits; otherwise state the unverified manual risk.
8. Record each issue against the applicable WCAG criterion, evidence, severity, fix and verification.

Do not weaken a rule to make an automated test pass. Fix the experience or document a genuine exception with owner and remediation path.

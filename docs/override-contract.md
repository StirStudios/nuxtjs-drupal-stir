# Stir Nuxt Override Contract

This document defines the Nuxt side of the Stir rendering contract for site overrides.

## Ownership

`nuxtjs-drupal-stir` owns shared rendering defaults and safe component contracts.

Site projects own brand-specific presentation and one-off content layouts.

If the same override pattern is needed by more than one site, it should usually move upstream.

## Node overrides

A node override should preserve structural slots unless it intentionally replaces the entire page shell.

Full node overrides should forward:

- `hero`
- `section`
- component attrs
- relevant admin/edit controls

Teaser node overrides should preserve:

- canonical link behavior
- title rendering
- media summary rendering when present
- admin/edit controls when present

## Hero contract

`NodeDisplay` may provide a hero slot derived from Drupal payload data or fallback behavior.

Local node overrides must not accidentally drop this slot. If the override replaces body markup only, it should still render or forward the `hero` slot.

## Section contract

The `section` slot is the canonical node content slot. Overrides should either render it directly or intentionally replace it with equivalent body/content rendering.

## Teaser link contract

Teasers should use Drupal-provided route data.

Preferred link source order:

- explicit `url` when provided by Drupal
- `path.alias`
- defensive fallback only when neither canonical value exists

Downstream sites should not invent permanent link paths that Drupal already supplies.

## View row contract

A view row should render the same content shape whether it appears in:

- static views
- dynamic/filterable views
- carousel views
- grid/list views

View components should normalize rows once and share row rendering paths instead of branching by presentation mode.

## Media contract

Shared media components should accept both summary and detail payloads.

Teaser/list rendering should not assume full media detail exists.

Full/detail rendering may use richer fields only when present.

## App config contract

App config should control presentation defaults and feature toggles. It should not compensate for missing Drupal payload fields.

## Testing expectations

Shared-layer tests should protect these seams:

- hero forwarding from `NodeDisplay` through default node components
- teaser links from `path.alias`
- static and dynamic view row shape parity
- carousel and grid row rendering parity
- media summary payload rendering

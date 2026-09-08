# Hero actions

The shared full hero groups its existing Drupal button slot in `.hero-actions`.
Defaults follow Nuxt UI PageHero: a wrapping flex row with horizontal and vertical gaps.
Direct Paragraph button wrappers use automatic width within this group rather than consuming a full row.
No Drupal field or payload change is needed. Existing Button Paragraph variants, links, edit controls and source order remain intact. Simple hero mode is unchanged.

`stirTheme.hero.actions` is the theme class setting. Default: `flex flex-wrap gap-x-6 gap-y-3 [&>div]:w-auto`.
For a deliberate stacked treatment use `flex flex-col items-start gap-3 [&>div]:w-auto`.
This is a shared theme setting, not a new Drupal editor field. Buttons wrap naturally when their combined widths exceed the available space.

Reference: https://ui.nuxt.com/docs/components/page-hero (links theme and slot).

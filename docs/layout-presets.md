# Layout composition

Reuse the existing Hero paragraph for full-background media, authored text and actions within a page. Drupal's Hero module supplies optional alignment and minimum-height controls. No separate Section hero layout is needed.

`placement` is the owning paragraph field: `field_hero` retains the page hero; any other nonempty field uses the authored section heading. `headerTag` accepts H2–H6 for sections and defaults to H2. `mediaHeight` accepts `natural`, `break`, or `feature`; explicit heights are minimums and allow content to grow. Missing controls preserve existing page hero behavior. Headings, intro and buttons are independently optional. Brand typography belongs in the client theme and should target a class rather than a heading tag.

An existing one-column layout can use `action-group` for wrapping buttons, with `action-group--center` or `action-group--right` for alignment. Each Button retains its own link and appearance. Hero uses `stirTheme.hero.actions` for its button slot.

No media-grid overrides are needed: use existing asymmetric row layouts and Media height with overlay playback, or a media collection's responsive grid settings for equal columns. Playback is not cropped by these layouts.

Update both the Nuxt layer and Stir Tools, run Drupal database updates, and enable Hero in the desired paragraph reference field. No environment changes are required.

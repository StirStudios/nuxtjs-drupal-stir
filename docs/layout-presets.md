# Layout presets

Section hero is selected through Drupal's `stir_layout_presets` module. It uses the existing Paragraph Layout renderer, media, text and buttons. The shared CSS accepts `section-hero` and `section-hero--natural`, `--break`, or `--feature`. Minimum heights allow long content to grow; the background fills the section. Existing region alignment is respected. The content gap is 2rem and occurs only between blocks.

Theme variables: `--section-hero-height`, `--section-hero-content-gap`, `--section-hero-overlay`, `--section-hero-background`, and `--section-hero-color`. Brand typography belongs in the client theme. A section heading should be H2; content may also omit heading, intro or actions. Background image editing remains in Drupal.

An existing one-column layout can use `action-group` for wrapping buttons, with `action-group--center` or `action-group--right` for alignment. Each Button retains its own link and appearance. The page hero uses `stirTheme.hero.actions` for its button slot.

No media-grid overrides are needed: use existing asymmetric row layouts and Media height with overlay playback, or a media collection's responsive grid settings for equal columns. Playback is not cropped by these layouts.

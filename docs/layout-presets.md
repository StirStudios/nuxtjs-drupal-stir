# Layout composition

Reuse the existing Hero paragraph for full-background media, authored text and actions within a page. Drupal's Hero module supplies optional alignment and minimum-height controls. No separate Section hero layout is needed.

`placement` is the owning paragraph field: `field_hero` retains the page hero; any other nonempty field uses the authored section heading. `headerTag` accepts H2–H6 for sections and defaults to H2. `mediaHeight` accepts `natural`, `break`, or `feature`; explicit heights are minimums and allow content to grow. Missing controls preserve existing page hero behavior. Headings, intro and buttons are independently optional. Brand typography belongs in the client theme and should target a class rather than a heading tag.

An existing one-column layout can use `action-group` for wrapping buttons, with `action-group--center` or `action-group--right` for alignment. Each Button retains its own link and appearance. Hero uses `stirTheme.hero.actions` for its button slot.

No media-grid overrides are needed: use existing asymmetric row layouts and Media height with overlay playback, or a media collection's responsive grid settings for equal columns. Playback is not cropped by these layouts.

Update both the Nuxt layer and Stir Tools, run Drupal database updates, and enable Hero in the desired paragraph reference field. No environment changes are required.

Hero and Text also accept an optional `eyebrow` string, rendered as a plain paragraph above the content. Blank labels are omitted. Drupal supplies this from shared `field_eyebrow` storage; its `eyebrow_fields` update adds missing fields and controls without rewriting existing copy. Projects may style `.paragraph-eyebrow` for their brand.

Hero title wording and intro use the existing `EditableRichText` editor. Heading edit mode preserves Drupal's stored `h2|` (or other heading tag) prefix while showing only the wording to the editor. HTML heading-tag selection remains in the full Drupal form. The main Hero renders one H1: its authored heading overrides the Drupal page title, which remains the fallback. Hide title visually hides that same H1 with sr-only. Eyebrows remain ordinary text; section Heroes keep H2–H6. Saves reuse the existing protected text endpoint and revision ownership behavior; no new endpoint or environment setting is introduced.

Normal paragraph layouts use one theme setting, `--stir-content-action-gap` (default `1.5rem`, 24px), when text is followed by a Button paragraph or action group. Button-only content receives no leading gap. Individual Button paragraphs no longer add their own vertical margins; the group owns inter-button spacing. Set the CSS variable once in the client theme to adjust this default. Explicit authored spacing remains available for exceptional layouts.

Main and section heroes use this same variable for their content flow. A hero containing only actions has no leading gap. Button-to-button spacing remains independent.

Eyebrow spacing uses `--stir-eyebrow-gap` (12px default). Eyebrows remain separate from the main H1 and content-to-actions spacing.

Media paragraphs accept `titleDisplay`: `hidden` (default), `below`, or `over`. This labels each image/video using its existing media title; the paragraph heading remains above the collection. Blank titles render nothing. Over-preview uses small, italic uppercase white text over a bottom gradient; inline video falls back to below so controls remain clear. Run Drupal database updates to install the optional control on existing sites.

Main hero width is configured through `stirTheme.hero.text`: `base` defaults to a full-width container with children limited to `max-w-3xl` for readable lines. Projects may add `max-w-(--ui-container)` to `isFront` to match page edges, or omit it for full width. Override the child limit with `[&>*]:max-w-*` in the same setting. CMS alignment positions that content within the container; padding controls the edge inset.

The Small media-height preset uses `clamp(12rem,22vw,18rem)`. Applying it to adjacent Media paragraphs gives their previews equal height despite different column widths, using the existing crop behaviour. Hero also supports Small as a minimum height. Upgrade Stir Tools and run database updates to expose the new option.

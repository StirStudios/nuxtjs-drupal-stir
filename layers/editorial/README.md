# Editorial layer

This layer owns editor-only presentation for Drupal local tasks, account-menu
navigation, entity and paragraph edit actions, and inline formatted-text
editing. It also owns the authenticated formatted-text read/write proxy routes;
consumers that omit this layer do not ship those mutation endpoints. Drupal
remains authoritative for authentication, access checks, and the links or
tasks exposed to Nuxt.

`EditableRichText` accepts an `editTarget` containing `entityType`, `entityId`,
and `fieldName`. The matching Drupal formatter emits this metadata beside
single-value formatted-text fields, so node bodies and paragraph text use the
same editor without bundle-specific endpoints or downstream coercion. The
legacy paragraph `id` prop remains a compatibility fallback.

Paragraph edit controls also expose a compact Nuxt UI presentation editor when
Drupal includes a `presentationEdit` capability for that exact paragraph. Its
private proxy reads and writes the safe boolean and options fields Drupal places
in a paragraph form's **Layout** and **Animations** groups; Drupal remains
authoritative for field keys, labels, descriptions, options, access checks,
validation, and revision creation. Parent Layout quick settings remain a
separate popover, so a nested paragraph's own settings are never silently
replaced by its container's settings. Each popover retains the corresponding
full Drupal edit link for every setting outside that deliberately small
contract.

Eligible Layout Paragraphs containers also show Drupal's enabled layout
plugins as visual radio cards. When a target removes populated regions, the
editor displays Drupal's suggested destinations and requires an explicit valid
mapping before Save. Layout and presentation changes share one save request;
the owning revision token prevents stale overwrites. Region names, icons,
choices, mapping requirements, permissions, and validation remain Drupal-owned.
Eligible Layout Paragraphs also expose a visual arranger. Dragging, keyboard
move controls, and staged removals update only local state; one explicit save
submits the complete ordered region arrangement with Drupal's owner-revision
token. Removed items remain visible with an Undo action until save. Drupal
remains the source of truth and rejects stale, incomplete, duplicate, or
unauthorized arrangements before atomically saving the owning aggregate.

The editor keeps Drupal's stored text format unchanged, preserves supported
Drupal-specific blocks such as `<drupal-media>` and `<stir-cta>`, and exposes a
Nuxt UI drag handle for safe top-level block reordering. Drupal remains the
source of truth for field access, required validation, revision creation, and
the saved HTML value.

The full compatibility preset includes this capability so established projects
retain their editorial tools. The minimal preset omits it; shell-free theme
fallbacks preserve public rendering for shared components without loading edit
controls, local-task tabs, inline-edit behavior, or admin CSS.

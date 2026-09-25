# Editorial stack

Use this reference only for the optional inline-editorial layer built with Tiptap, ProseMirror and Yjs.

## Preserve the content contract

- Treat Drupal field values, text formats and entity revisions as the persisted source of truth. The editor is a client for that contract, not a second content model.
- Define the smallest schema that round-trips supported Drupal markup without silently dropping nodes, attributes or links. Reject or visibly preserve unsupported content.
- Keep HTML sanitization and authorization on the Drupal boundary. Never treat editor-generated HTML as trusted merely because it came from Tiptap.
- Preserve revision, translation, moderation and concurrent-editing semantics when saving. A successful editor request must not bypass the owning Drupal entity workflow.

## Keep the optional layer isolated

- Load editor and collaboration code only for authenticated editorial sessions. Do not add Tiptap, ProseMirror or Yjs to anonymous public-page bundles.
- Declare every imported Tiptap extension, `@tiptap/pm`, collaboration adapter and Yjs package directly in the published layer manifest. Keep their compatible versions aligned and do not rely on Nuxt UI or another dependency to provide them transitively.
- Create editor and collaboration instances per mounted editing surface. Destroy editors, providers, awareness listeners, observers and timers on unmount or document change.
- Avoid duplicate extension names and implicit schema changes. Review release notes before updating Tiptap, ProseMirror or Yjs together.

## Verify

1. Test parse-edit-serialize round trips for headings, lists, links, Drupal media, custom nodes and malformed or unsupported markup.
2. Test empty, long and concurrent edits, revision conflicts, authorization failures, network failures and teardown/remount behavior.
3. Confirm anonymous production output excludes editorial UI and its heavy dependencies.
4. Run the packed-consumer test so dependency ownership is verified outside the upstream workspace.

## Current primary sources

- Tiptap installation and dependency guidance: https://tiptap.dev/docs/editor/getting-started/install/vue3
- Tiptap extensions and schema: https://tiptap.dev/docs/editor/core-concepts/schema
- Tiptap collaboration: https://tiptap.dev/docs/collaboration/getting-started/install
- ProseMirror guide: https://prosemirror.net/docs/guide/
- Yjs documentation: https://docs.yjs.dev/
- Nuxt layers: https://nuxt.com/docs/4.x/guide/going-further/layers/

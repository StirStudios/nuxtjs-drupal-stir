# Integrations Layer

`layers/integrations` owns the optional popup and privacy-notice UI together
with the consent policy consumed by analytics and trusted third-party scripts.
It is excluded from the minimal preset and included by the full compatibility
preset.

Downstream projects configure the public `popup` and `privacyNotice` app-config
keys as before. The base theme provides only an empty application mount and a
neutral script-permission fallback so it does not register or ship the optional
integration implementation.

## Privacy notice: skipped pages and phone bar

Both settings are optional and default to the floating card on every page.

```ts
privacyNotice: {
  ignoredPaths: ['/pricing/checkout'],
  ignoredPathPrefixes: ['/onboarding'],
  mobilePresentation: 'bar',
}
```

- `ignoredPaths` and `ignoredPathPrefixes` match like `cmsGlobalSeo`: exact
  paths, or a prefix followed by `/` (a bare `/` prefix is ignored). The policy
  URLs are always skipped. Skipping a page records no decision and writes no
  cookie. In `consent` mode the visitor stays undecided there, so
  non-essential scripts stay off (`allowsNonEssentialScripts`) until they
  accept on another page.
- `mobilePresentation: 'bar'` renders a full-width strip below `md`, capped at
  20% of the viewport with the text scrolling and the buttons kept in view.
  Dialog role, accessible name, live region and the accept, decline and dismiss
  buttons are the same as the card.

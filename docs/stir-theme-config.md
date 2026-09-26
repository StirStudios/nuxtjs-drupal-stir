## StirStudios Nuxt App Config Reference

This document outlines the full structure of the StirStudios `app.config.ts` file, including all relevant options under `colorMode`, `userway`, `stirTheme`, and the extended `ui` Nuxt UI presets.

---

### 🔧 `colorMode`

The layer defaults, which apply to any key a project does not set:

```ts
colorMode: {
  forced: false,
  preference: 'dark',
  showToggle: false,
  lightRoutes: [],
  darkRoutes: [],
}
```

Two consequences are worth knowing before configuring a site:

- **A project that sets no `preference` gets dark.** `preference` also falls
  back to `'dark'` for any unrecognised value, so a light site must say
  `preference: 'light'` rather than rely on the default.
- **The toggle is hidden by default, which locks the theme.** `showToggle:
  false` alone is enough to enforce `preference` as the baseline, so most
  projects never need `forced: true`. Because the theme is locked, the color
  mode module never persists a preference: no `nuxt-color-mode` value is
  written to browser storage unless a project turns the toggle back on.

#### `colorMode` behavior and precedence

- `forced: true`
  - Forces all routes to `preference`.
  - Theme toggle is hidden.
  - `lightRoutes` and `darkRoutes` are ignored while forced mode is on.
- `forced: false`
  - Route overrides apply first:
    - `lightRoutes` => route forced to light.
    - `darkRoutes` => route forced to dark.
  - If no route override matches:
    - `showToggle: false` => `preference` is enforced as baseline.
    - `showToggle: true` => user preference is allowed.

#### Toggle visibility notes

- `showToggle: false` hides the color mode button.
- Header right-slot spacing is collapsed when toggle is hidden (no empty right gap).

#### Route matching rules

- Use `'/'` for homepage only.
- Route arrays use exact matching by default (e.g. `'/pricing'` matches `/pricing` only).
- Use a trailing `*` to match a route and its child paths (e.g. `'/pricing*'` matches `/pricing` and `/pricing/teams`).
- Use a trailing `/*` to match child paths only (e.g. `'/pricing/*'` matches `/pricing/teams`, but not `/pricing`).
- Empty entries are ignored (do not use `''`).

#### Common patterns

Hide toggle but keep route-based forcing:

```ts
colorMode: {
  forced: false,
  preference: 'dark',
  showToggle: false,
  lightRoutes: ['/clients', '/book', '/calculator', '/photos'],
  darkRoutes: [],
}
```

Force dark homepage, light elsewhere, no toggle:

```ts
colorMode: {
  forced: false,
  preference: 'light',
  showToggle: false,
  lightRoutes: [],
  darkRoutes: ['/'],
}
```

### 🧑‍🦽 `userway`

```ts
userway: {
  enabled: false,
  account: '',
  loadDelayMs: 5000,
  position: 3,
  size: 'small',
  color: '#ffffff',
  type: '1',
}
```

`loadDelayMs` delays the accessibility widget until after Nuxt is ready. The
default uses Nuxt Scripts' idle-timeout trigger to keep UserWay out of the
initial rendering and hydration window without gating it on tracking consent.
Connection warmup is disabled so the widget is not fetched before that trigger.

### 🔐 `protectedRoutes`

```ts
protectedRoutes: {
  loginPath: '/login',
  requireLoginPaths: [],
  fallbackRedirectPath: '/',
}
```

### 🔑 Drupal account capability

Drupal `/api/auth/config` owns account availability, redirects, UI copy, and
password policy. Disable **Decoupled frontend accounts** in Stir Account
settings to close the account UI routes while keeping `/auth/protected`
available. No app-config flag is required.

### 🔐 `stirTheme.auth`

Auth presentation stays in Nuxt so projects can choose a shared layout without
adding visual concerns to Drupal:

```ts
stirTheme: {
  auth: {
    layout: 'card-split',
    backgroundImage: '/themes/custom/site/auth.jpg',
    imagePosition: 'left',
    showIcon: true,
    backgroundClass: 'bg-muted/50 dark:bg-default',
    showBackgroundDecoration: true,
    card: {
      class: 'shadow-none ring-0',
    },
    secondaryAction: {
      label: 'Back to login',
    },
    backButton: {
      enabled: false,
    },
    submitButton: {
      size: 'xl',
      class: 'uppercase',
    },
    pages: {
      login: {
        layout: 'page-split',
        backgroundImage: '/themes/custom/site/login.jpg',
      },
      logout: {
        layout: 'card',
        backgroundImage: '/themes/custom/site/logout.jpg',
      },
      passwordReset: {
        layout: 'card-split',
        backgroundImage: '/themes/custom/site/reset-password.jpg',
      },
    },
  },
}
```

- Layout options are `card`, `card-split`, and `page-split`.
- `imagePosition` accepts `'left'` or `'right'` for split-layout visuals.
- `submitButton` accepts Nuxt UI `UButton` props, including `size: 'xl'`,
  `color`, `variant`, `icon`, and `class`.
- `pages` also supports `register`, `passwordRequest`, `verify`, and `protectedPage`.
- Per-page settings override global auth theme settings.
- `backgroundClass` replaces the default auth canvas classes, while
  `showBackgroundDecoration` controls the default blurred decoration.
- `card` controls the shared auth card surface, including its `class`, `ui`,
  and Nuxt UI `variant`; use it to remove or replace the default shadow.
- `secondaryAction` controls page navigation rendered above the card, such as
  “Back to login”. It accepts `enabled`, `label`, `to`, `class`,
  `wrapperClass`, `icon`, `color`, and `variant`.
- `backgroundImage` should reference the original Drupal image. Auth layouts
  automatically deliver it through Nuxt Image/IPX as a 1920px WebP background.
- Auth layouts and visuals are read only from `stirTheme.auth`, never from
  Drupal's auth configuration response.

### 🔎 `cmsGlobalSeo`

```ts
cmsGlobalSeo: {
  enabled: false,
  ignoredPathPrefixes: ['/account', '/auth'],
  ignoredPaths: [],
  drupalRouteNames: ['slug'],
}
```

- Disabled by default because `/api/seo/global` requires downstream Drupal support.
- Set `enabled: true` to fetch `/api/seo/global` and apply Drupal global SEO defaults.

### 📊 `analytics`

```ts
analytics: {
  plausible: {
    enabled: false, // optional production opt-out
    domain: 'domainname.com', // without https://www
  },
}
```

Migration note:

- `analytics.plausible.scriptUrl` and `analytics.plausible.scriptId` are removed.
- Plausible now uses `@nuxtjs/plausible` with `analytics.plausible` only overriding `enabled` and `domain`.
- `analytics.plausible.enabled` can disable Plausible, but `NUXT_ENV=production` controls whether it can run.
- Use `NUXT_PUBLIC_PLAUSIBLE_API_HOST` for API host overrides.
- In privacy `consent` mode, Plausible initialization and events are deferred until acceptance.

### 🔗 `thirdPartyScripts`

CMS-provided script URLs are accepted only from exact HTTPS origins in this
allowlist:

```ts
thirdPartyScripts: {
  allowedOrigins: {
    calculator: ['https://piper.b-cdn.net'],
    enzuzo: ['https://app.enzuzo.com'],
  },
}
```

The calculator default matches the widget URL shipped by `stir-tools`.
Downstream projects using another calculator host must add its exact origin;
lookalike subdomains and HTTP URLs are rejected. Enzuzo remains available after
a visitor declines optional tracking because it renders legal/compliance
content, but its URL is still origin-validated.

Calendly and Bunny PlayerJS use fixed vendor origins. PlayerJS is requested only
when a visitor activates an embedded video and retains Bunny's official
`playerjs-latest.min.js` URL because Bunny does not publish a supported pinned
loader URL. UserWay remains ungated as an accessibility-essential service.

### 💬 `popup`

```ts
popup: {
  enabled: false, // global mount switch for <LazyAppPopup />
  component: '', // optional globally registered popup body
  dismissalTtlDays: 14, // days before a dismissed campaign may appear again
  hideWhenLoggedIn: false, // hide from signed-in Drupal users (auth layer)
}
```

Place popup blocks in the hidden Drupal `popups` region of the `stir_decoupled`
theme; Nuxt reads them from `blocks.popups`, falling back to the legacy
`blocks.decoupled` region until the Drupal site has run its database updates.
Popup visibility should be controlled in Drupal block visibility settings
(Show/Hide for listed pages). Nuxt no longer applies route allow/block lists.
`dismissalTtlDays` accepts a positive number and falls back to 14 when omitted
or invalid.

Storage semantics: suppression is stored per campaign (`uuid`, else `id`) in
`localStorage` under `stir:marketing-popup-dismissals`.

- Dismissal (close button, Escape, overlay, or the body calling `onClose`)
  hides the campaign for `dismissalTtlDays`.
- Completion (the body calling `onComplete`, for example after a successful
  signup) hides the campaign permanently in that browser.
- A popup closed because it became suppressed, such as a visitor signing in,
  records nothing.

`hideWhenLoggedIn: true` renders nothing until `/api/auth/session` resolves, so
signed-in visitors never see a flash; the popup then stays hidden for them. It
requires the auth layer. If the session request fails, the popup stays hidden.

Each time the popup opens, the layer calls the `stir:popup:shown` Nuxt app hook
with `{ key, popup }`, where `key` is the campaign key above. Use it for
analytics from a project plugin:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('stir:popup:shown', ({ key }) => {
    useTrackEvent('Marketing popup shown', { props: { campaign: key ?? '' } })
  })
})
```

### 🍪 `privacyNotice`

```ts
privacyNotice: {
  enabled: false,
  mode: 'notice', // 'notice' | 'consent'
  position: 'center', // 'left' | 'center' | 'right'
  dismissible: true,
  title: '',
  message: '',
  messageLinks: 'For more information please review our',
  termsUrl: '',
  privacyUrl: '',
  buttonLabel: 'Got it',
  declineButtonLabel: 'Decline',
}
```

`notice` mode example (no consent gate, simple acknowledgement):

```ts
privacyNotice: {
  enabled: true,
  mode: 'notice',
  position: 'center',
  title: 'Privacy Notice',
  message: 'We use essential cookies to run this website.',
  buttonLabel: 'Got it',
  termsUrl: '/terms-service',
  privacyUrl: '/privacy-policy',
}
```

`consent` mode example (explicit accept/decline):

```ts
privacyNotice: {
  enabled: true,
  mode: 'consent',
  position: 'center',
  dismissible: false,
  title: 'Cookie Consent',
  message: 'We use analytics cookies to improve your experience.',
  buttonLabel: 'Accept',
  declineButtonLabel: 'Decline',
  termsUrl: '/terms-service',
  privacyUrl: '/privacy-policy',
}
```

In `consent` mode, Plausible, Calculator, Calendly, and Bunny PlayerJS wait for
acceptance. In `notice` mode, or when the notice is disabled, existing loading
behavior is preserved. Enzuzo legal content and the UserWay accessibility
widget are treated as essential exceptions.

Application code can read or change the shared decision through
`usePrivacyConsent()`. Calling `withdraw()` marks consent declined and reloads
the page by default so already-executed vendor code is fully torn down; use
`withdraw({ reload: false })` only when the caller handles teardown itself.

---

## 🎨 `stirTheme`

Recommended key order in `stirTheme`:

1. Global flags and layout primitives:
   `showPdf`, `showBreadcrumbs`, `container`, `navigation`, `hero`, `footer`
2. Content/component behavior:
   `media`, `carousel`, `mediaModal`, `overlay`, `webform`, `turnstile`
3. Visual/system tokens and utilities:
   `card`, `gradients`, `animations`, `scrollButton`, `error`

### ✨ General

```ts
showPdf: false,
loadingIndicator: 'repeating-linear-gradient(to right,#D21B18 0%,#ED6663 50%,#F28E8D 100%)',
showBreadcrumbs: false,
```

### 🔗 `navigation`

```ts
navigation: {
  mode: 'fixed',
  modeRoutes: {
    sticky: ['/work*'],
  },
  logo: true, // false shows the site title text in place of the logo
  brand: true, // false renders neither logo nor site title in the header
  logoClass: 'h-[5rem]',
  hidden: false,
  transparentAtTop: false,
  base: 'h-auto transform py-3 duration-500',
  background: 'border-none bg-white/90 shadow backdrop-blur-md dark:bg-gray-950/70',
  color: 'primary',
  variant: 'link',
  contentOrientation: 'horizontal', // 'vertical' stacks dropdown links under the open item
  desktopLayout: 'default', // 'default', 'split-logo', 'centered-toggle' or 'toggle'
  logoMenuMarker: '--logo--',
  toggleDirection: 'right', // 'left' or 'right'
  toggleIcon: 'size-7',
  actionItems: [], // route main-menu items into the header actions region
  splitLogo: {
	center: 'flex-1 items-center justify-center',
	container: 'relative',
	desktopNav: 'hidden lg:flex',
	leftNav: 'app-nav app-nav-left',
	logoLink: 'app-logo-link mx-4 inline-flex shrink-0 items-center lg:mx-8',
	mobileLogo: 'lg:hidden',
	mobileLeft: 'lg:hidden flex items-center gap-1.5',
	right: 'lg:absolute lg:right-4',
	rightNav: 'app-nav app-nav-right',
  },
  highlight: {
	show: false,
	color: 'primary',
  },
  slideover: {
	logo: true,
	angle: false,
	angleDeg: 35,
	angleOffsetX: '1.5rem',
	link: 'min-h-12 justify-start rounded-lg px-4 py-3 text-start text-base font-medium text-default before:rounded-lg hover:text-highlighted hover:before:bg-elevated/60 data-[active]:text-primary data-[active]:before:bg-primary/10 sm:text-lg',
	list: 'w-full space-y-1.5',
	body: 'flex flex-col',
  },
}
```

The mobile panel defaults to top/left-aligned, full-width navigation rows. Its
header and body have responsive horizontal padding, and hover/active surfaces
span the row for a conventional touch target. Override `slideover.link`,
`slideover.list`, or `slideover.body` only for a project-specific navigation
treatment.

`navigation.mode` accepts `'fixed'` or `'sticky'`. Use `'fixed'` for an overlay
header that sits above page content, and `'sticky'` for an in-flow header that
reserves its own document space while keeping the same scroll hide/reveal
behavior.

Use `navigation.modeRoutes` to override the default mode for specific routes.
In the example above, the header defaults to `'fixed'`, while `/work` and nested
work routes use `'sticky'`. Patterns ending in `*` match the route and its child
paths.

For a centered-logo desktop header, set `navigation.desktopLayout` to
`'split-logo'` and place a placeholder Drupal menu link whose title matches
`navigation.logoMenuMarker`. The marker must be present in the menu API output.
Items before that marker render to the left of the logo, items after it render
to the right, and the marker is removed from the mobile menu.

For a header whose menu toggle is the only navigation at every breakpoint, set
`navigation.desktopLayout` to `'centered-toggle'`. The logo sits left, the
toggle in the centre and project actions on the right.

For a header that is only the menu toggle at every breakpoint, beside the
brand rather than centred, set `navigation.desktopLayout` to `'toggle'`. The
toggle sits on the side set by `navigation.toggleDirection` (`'left'` or
`'right'`; `'top'` and `'bottom'` place it right), the slideover opens at every
breakpoint, and no inline menu renders. Configured `navigation.actionItems`
and `navigation.actionsComponent` still render in the right region.

Set `navigation.brand: false` to drop the logo and site title from the header,
for example when the page hero carries the site name. It applies to every
layout. `navigation.logo: false` alone swaps the logo for the site-title text.
The slideover's own brand is controlled separately by
`navigation.slideover.logo`.

```ts
navigation: {
  desktopLayout: 'toggle',
  toggleDirection: 'left',
  brand: false,
},
```

Project hooks, all optional:

- `navigation.toggleComponent` names a globally registered component rendered
  inside the toggle button in place of the icon. It receives `open` and
  `scrolled`.
- `navigation.actionsComponent` names a globally registered component rendered
  in the right region after any action items. It receives `scrolled` and
  `actions`, the resolved `navigation.actionItems`, which the layer already
  renders.
- `navigation.actionItems` moves top-level main-menu items into the right
  region. Each rule has `match` (a menu title, or a position where negative
  numbers count from the end), `as` (`'navigation'`, the default, or
  `'button'`) and `mobile` (`'menu'`, the default, keeps the item in its menu
  position; `'button'` renders it as a full-width button below the mobile menu;
  `'hidden'` omits it). Button rules accept `color`, `variant`, `size`, `class`
  and `icon`. Navigation items share one `Secondary navigation` menu, so
  dropdown children and keyboard behavior match the main menu. Action items
  show from `lg` up; below that they live in the mobile panel. Positions count
  the full top-level menu, including a split-logo marker.

  ```ts
  actionItems: [
    { match: -2, as: 'button', mobile: 'button', color: 'secondary', size: 'lg' },
    { match: -1 },
  ],
  ```
- `navigation.toggleClass` adds classes to the header toggle only. Use
  `aria-expanded:` variants to style the open state.
- `navigation.slideover.content` replaces the panel background classes.
- `navigation.slideover.portal`, `overlay` and `unmountOnHide` pass through to
  Nuxt UI Slideover. Set both `portal: false` and `unmountOnHide: false` to keep
  the closed menu in the server-rendered HTML.

Closing the menu returns focus to its toggle, except when a menu link
navigates.

`stirTheme.clientComponents` lists globally registered components that only
make sense in the browser, such as a custom cursor or page transition. `app.vue`
mounts each once inside `ClientOnly`; unknown names render nothing.

Drupal's optional menu-link description is passed directly to Nuxt UI navigation
items. Add concise descriptions in Drupal to enrich dropdown children; links
without descriptions retain the existing compact presentation.

Common downstream override:

```ts
stirTheme: {
  navigation: {
    mode: 'fixed',
    transparentAtTop: true,
    desktopLayout: 'split-logo',
    logoMenuMarker: '--logo--',
    color: 'primary',
    variant: 'link',
  },
},
```

### 📦 Layout

```ts
container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
```

When Drupal enables **Card** on a Layout paragraph, the grid is rendered with
Nuxt UI `UCard`. The existing `stirTheme.card` classes and optional Drupal
gradient remain the branded layout surface. When **Card** is enabled on a Text
paragraph, the text is rendered in a standard `UCard`, so projects can theme
that reusable surface through Nuxt UI's global `ui.card` configuration. With
Card disabled, both paragraph renderers retain their existing minimal markup.

### 🪟 `overlay`

Use this to control Nuxt UI overlay portal behavior for popovers, modals, and select menus.

```ts
overlay: {
  portal: true, // true, false, CSS selector, or HTMLElement
},
```

Set `portal: false` when the layer is rendered inside a Shadow DOM host and you need overlays to remain in-tree.

### 🦶 `footer`

```ts
footer: {
  layout: 'default', // 'default', 'columns', or 'stacked'
  requireSiteName: false,
  base: 'mt-12 bg-accented py-10 text-sm text-default dark:bg-muted/50 lg:mt-20',
  container: '',
  content: 'flex flex-col items-center justify-center gap-4 text-center',
  left: 'mt-8 text-sm leading-relaxed lg:mt-0 lg:text-left',
  center: '',
  right: 'flex flex-col items-center gap-2 lg:items-end lg:text-right',
  sections: {
    left: ['logo'],
    center: ['menu', 'legal'],
    right: ['socials', 'email'],
  },
  copyright: 'mb-0',
  email: '',
  footerLinks: 'transition-colors text-primary hover:text-primary/90',
  logo: '',
  menu: 'mb-3',
  menuItem: 'min-w-0 py-0',
  menuList: 'flex flex-wrap justify-center',
  poweredBy: 'mb-0',
  rights: '', // Add additional rights
  showCopyright: true,
  showEmail: true,
  showFooterRegion: true,
  showLogo: true,
  showMenu: true,
  showPoweredBy: true,
  showSlogan: false,
  showSocials: true,
  showSubFooterRegion: true,
  slogan: 'mb-2',
  socialIcon: 'me-1',
  socials: 'flex gap-1',
}
```

Footer `sections` accepts these atoms: `logo`, `menu`, `socials`,
`slogan`, `email`, `legal`, `copyright`, and `poweredBy`. The default `legal`
atom preserves the original single copyright/powered-by paragraph. Use
`layout: 'stacked'` for a single centered footer column, or keep
`default`/`columns` for the standard left/center/right `UFooter` slots.
Project-specific CTA links should be implemented in the downstream project by
overriding the footer component or adding a project footer region.

Common downstream atom-order override:

```ts
stirTheme: {
  footer: {
    layout: 'stacked',
    sections: {
      center: ['logo', 'menu', 'socials', 'email', 'legal'],
    },
  },
},
```

### 🌐 `socials`

```ts
socials: [
  {
    title: 'IMDB',
    url: '//imdb.com/name/CLIENT/',
    icon: 'i-social-imdb',
    iconSize: 'size-10',
  },
  {
    title: 'LinkedIn',
    url: '//linkedin.com/in/CLIENT',
    icon: 'i-social-linkedin',
    iconSize: 'size-10',
  },
  {
    title: 'TikTok',
    url: '//tiktok.com/@CLIENT',
    icon: 'i-social-tiktok',
    iconSize: 'size-10',
  },
  {
    title: 'Pinterest',
    url: '//pinterest.com/CLIENT',
    icon: 'i-social-pinterest',
    iconSize: 'size-10',
  },
]
```

Social profile entries are opt-in. The shared icon collection currently
includes Facebook, Instagram, LinkedIn, Pinterest, TikTok, X, YouTube, and
IMDb; downstream projects should configure only the profiles they maintain.

### 🖼️ `media`

```ts
media: {
  base: 'relative h-full w-full overflow-hidden object-cover',
  rounded: 'rounded-xl',
  video: {
    loadMinWidth: 0,
    loadStrategy: 'after-load',
  },
},
```

Hero and bare background videos keep their poster in the initial HTML. By
default, their source URL is deferred until after the window load milestone at
every viewport width. When the user prefers reduced motion, the poster remains
static and the video is not requested. Set `media.video.loadMinWidth` to a
positive CSS-pixel width only when a project intentionally wants static posters
below a breakpoint. Set
`media.video.loadStrategy` to `'immediate'` only when a downstream project
intentionally accepts that performance tradeoff. The Drupal media payload
remains the source of truth for image loading,
priority, responsive derivatives, dimensions, and quality.

The Media paragraph can also request square corners for a specific placement.
That contextual choice is passed to visual media only and overrides
`stirTheme.media.rounded` for that paragraph; leaving it at **Site default**
continues to use the global theme setting. This keeps reusable Media entities
free of layout-specific presentation while allowing edge-to-edge imagery to
render without project CSS.

For repeatable local mobile performance measurements, let the repository build,
start, warm, verify compression, test, and stop the production server:

```bash
pnpm perf:lighthouse:local -- --path=/ --runs=3
```

Use `--port=3012` to change the local port. For an existing local, staging, or
production server, use the lower-level runner directly:

```bash
pnpm perf:lighthouse -- --url=http://127.0.0.1:3000/ --runs=3
```

Add `--assert` to enforce the default budgets, or override them with
`--min-score`, `--max-lcp`, `--max-tbt`, `--max-total-bytes`, and
`--max-image-bytes` and `--max-video-bytes`. The default transfer budgets are
2 MB total, 1 MB images, and no initial video transfer. Use
`--max-media-bytes` only when a project intentionally needs an additional
combined image/video cap. Set `LIGHTHOUSE_CHROME_PATH` when Chrome is not installed
in a standard system location. On macOS, a reproducible isolated browser can be
installed without changing the repository or the system browser:

```bash
pnpm dlx @puppeteer/browsers install chrome@stable \
  --path ~/Library/Caches/stir-lighthouse
```

The runner discovers the newest Chrome for Testing installation in that cache
automatically. Reports are written to the ignored
`.lighthouse/` directory. The summary includes separate image and video
transfer, combined media transfer, CSS and JavaScript transfer, estimated
unused bytes, render-blocking savings, script execution, and total main-thread
work so performance changes can target measured bottlenecks.

Common downstream media override:

```ts
stirTheme: {
  media: {
    rounded: 'rounded-none',
    effects: {
      scale: 'group-hover:scale-105',
    },
  },
  mediaModal: {
    title: false,
    description: {
      media: false,
      default: false,
    },
  },
},
```

### 🦸 `hero`

```ts
hero: {
  base: 'hero flex items-center justify-center overflow-hidden',
  mediaSpacing: 'min-h-[22rem] lg:min-h-[35rem] mb-20',
  noMediaSpacing: 'pt-30 lg:pt-54',
  overlay: 'relative min-h-[22rem] lg:min-h-[35rem] after:to-bg-black-10 after:absolute after:inset-0 after:z-auto after:h-full after:w-full after:bg-gradient-to-b after:from-black/80 after:via-black/50',
  isFront: 'h-screen',
  image: {
	base: 'absolute min-h-full w-auto max-w-none min-w-full',
	isFront: 'object-right-85 object-cover',
  },
  text: {
	base: 'z-10 max-w-2xl relative p-5 text-center',
	isFront: 'absolute bottom-0 left-0 p-10 lg:p-24',
  },
  hide: 'pt-30',
  // Optional: text-only heroes use this instead of mediaSpacing.
  textSpacing: 'pt-34 pb-26 lg:pt-48 lg:pb-56',
  // Optional: decorative layer behind text-only inner-page heroes.
  backdrop: 'bg-linear-to-br from-primary/10 to-transparent',
  inline: {
    base: 'mx-auto w-full max-w-(--ui-container) px-4 sm:px-6 lg:px-8',
    text: 'mx-auto max-w-4xl p-5 text-center',
  },
  nodeTypes: {
    'node-work': { layout: 'inline', media: 'last' },
  },
},
```

`nodeTypes` is keyed by the Drupal page payload `type` (for example
`node-work`) and only applies to page heroes (`field_hero`), not section
heroes.

- `layout: 'background'` (default) places media behind the text.
- `layout: 'inline'` renders the text, then the media in normal flow inside
  `inline.base`, without background sizing.
- `media: 'first' | 'last'` chooses which media slot item the hero renders.

`HeroContent` receives the resolved `layout`, so a downstream `HeroContent`
override can vary its title markup without replacing `ParagraphHero`.

Front-page title options (defaults shown):

```ts
hero: {
  front: {
    // 'replace': the authored header replaces the page title as the H1.
    // 'below': the page title stays the H1 and the header, or else the site
    // slogan, renders beneath it as an H2.
    subtitle: 'replace',
    subtitleClass: '',
    // false hides the hero text on the front page only.
    showText: true,
  },
},
```

Use `hero.text.isFront: 'sr-only'` to keep front-page titles for screen
readers while hiding them visually.

In `mode: 'simple'`, a programmatic `classes` prop wraps the header, media and
footer slots in one element.

### 🦸 `routeHero`

Page-level hero rendered by the default layout above the page content. Disabled
by default; existing sites render unchanged until `enabled` is `true`.

```ts
routeHero: {
  enabled: false,
  elements: [], // Drupal page elements resolved from the hero slot; empty means ['node-page']
  imageSelection: 'first', // 'first' | 'random' (SSR-stable seed in useState)
  parallax: true, // inert during SSR and under prefers-reduced-motion
  routes: [], // RouteHeroDefinition[]: { path, title, eyebrow, description, actions, image, variant, ... }
  base: 'route-hero relative isolate',
  band: 'route-hero-band isolate overflow-hidden',
  surface: 'bg-gradient-to-b from-gray-900 via-gray-800 to-black', // replaced by a hero's surfaceClass
  visual: 'absolute inset-x-0 top-0 -z-10 h-[calc(100%+7rem)]',
  image: 'inset-0 !h-full !w-full !object-cover',
  overlay: 'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/50 to-black/20',
  container: 'relative z-10 mx-auto w-full max-w-(--ui-container) px-4 md:px-5 lg:px-8',
  content: 'flex flex-col gap-[var(--stir-content-action-gap,1.5rem)]',
  eyebrow: 'mb-0 text-sm font-semibold tracking-[0.1em] uppercase',
  title: 'mb-0 text-balance',
  description: 'mb-0 max-w-3xl text-lg text-balance',
  actions: 'flex flex-wrap gap-x-6 gap-y-3',
  variants: {
    cover: {
      base: 'dark text-default flex min-h-[max(32rem,85dvh)] items-center py-24',
      band: 'absolute inset-0 -z-10',
      content: 'max-w-4xl items-start text-start',
    },
    simple: {
      base: 'dark text-default flex min-h-[22rem] items-end pt-32 pb-16 lg:min-h-[28rem] lg:pt-40',
      band: 'absolute inset-0 -z-10',
      content: 'items-center text-center [&>*]:max-w-4xl',
    },
    overlap: {
      band: 'relative min-h-[20rem] sm:min-h-[24rem] md:min-h-[34rem]',
      container: '-mt-32 pb-8 md:-mt-64 md:pb-12',
      content: 'bg-default text-default mx-auto max-w-4xl rounded-xl p-6 shadow-xl md:p-10',
    },
  },
}
```

- The rendered structure is `section` (`base` + variant `base`) > band
  (`band`, `surface`, variant `band`; holds `visual` with the image and
  `overlay`) and container (`container`) > content (`content`). Variant keys
  `base`, `band`, `container` and `content` add to the shared classes.
- `cover` shows the image behind the copy, `simple` is a text band without an
  image, and `overlap` puts the copy in a card that overlaps the image band. A
  hero without `variant` uses `cover` when it has an image, otherwise `simple`.
- The hero always renders exactly one `h1`; `hideTitle` keeps it for screen
  readers only. The image loads eagerly with `fetchpriority="high"`.
- When enabled, `node--page` skips its inline `hero` slot if `node-page` is in
  `elements`, so the Hero paragraph is not rendered twice.
- `routes[].path` uses the `colorMode` route patterns (exact, `/path*`,
  `/path/*`). Arrays merge with the layer default, which is empty.
- Resolution order and editorial usage are documented in
  [downstream-overrides.md](./downstream-overrides.md).

### 💥 Animations

```ts
animations: {
  once: false,
  reveal: {
    durationMs: 800,
    staggerMs: 250,
    threshold: 0,
    rootMargin: '0px 0px -10% 0px',
  },
},
```

Drupal page and Layout paragraph animation settings form an inheritance chain:

1. A node's `pageAnimation` is the default for supported page content.
2. A Layout paragraph can inherit that value, replace it for eligible children,
   or animate the whole layout as one unit.
3. Text, Media, Hero, and View paragraph `direction` values override the
   inherited effect. `off` explicitly disables inherited animation.

When staggering is enabled at page or Layout scope, eligible children consume
the configured `reveal.staggerMs` delay in content order. Reduced-motion
preferences always disable movement.

Project components can reuse the same reveal behaviour without importing
motion-v. Shorthand props override the `reveal` config for that element only:

```vue
<RevealMotionElement
  as="h2"
  effect="fade-up"
  :delay-ms="80"
  :duration-ms="600"
  :distance-px="24"
  root-margin="0px 0px -18% 0px"
>
  Selected work
</RevealMotionElement>
```

Content stays visible in the server-rendered HTML and animates after
hydration. A `motionProps` object, used by Drupal paragraphs, takes precedence
over the shorthand props.

### 🧩 Card and gradients

```ts
card: {
  base: 'relative isolate overflow-hidden rounded-xl bg-black/80 dark:bg-black py-16 text-white sm:py-20',
  effect: 'absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-6',
},
gradients: {
  1: 'bg-gradient-to-tr from-[#f35b0f] to-[#6b4ef2]',
  2: 'bg-gradient-to-r from-[#ff7f50] to-[#1e90ff]',
  3: 'bg-gradient-to-b from-[#7b2ff7] to-[#e53e3e]',
},
```

These `stirTheme.card` values apply to Layout cards. Standard Text cards use
Nuxt UI's semantic card tokens and therefore follow the surrounding color mode
and the project's global `ui.card` overrides.

### 🖼️ Carousel (StirTheme)

```ts
carousel: {
  base: '', // always on the wrapper that holds the heading and carousel
  padding: 'pb-12', // room for the dot indicators; only when they show
  root: '', // the inner UCarousel
  arrows: {
	prev: { color: 'neutral', variant: 'outline', size: 'md' },
	next: { color: 'neutral', variant: 'outline', size: 'md' },
	prevIcon: 'i-lucide-chevron-left',
	nextIcon: 'i-lucide-chevron-right',
  },
},
```

### 🧊 Media modal

```ts
mediaModal: { title: true },
```

### 🧊 Error

```ts
error: {
  label: 'Back to home',
  color: 'primary',
  size: 'xl',
  icon: 'i-lucide-arrow-left',
  variant: 'solid',
},
```

### 🧊 Scroll

```ts
scrollButton: {
  enabled: true,
  base: 'fixed bottom-4 left-4 z-50 rounded-full p-2 shadow-md transition-opacity duration-300',
  icon: 'i-lucide:arrow-up',
  variant: 'solid',
  showAtScrollY: 200,
},
```

### 🧊 Turnstile

```ts
turnstile: {
  appearance: 'interaction-only',
},
```

`interaction-only` is the layer default so protection remains active without
showing every visitor a challenge. Use `always` only when a project explicitly
requires a permanently visible widget.

### 🧊 Webform

```ts
webform: {
  showToasts: true,
  scrollToTopOnSuccess: true,
  scrollToTopOnReset: true,
  scrollToTopDelayMs: 0,
  scrollToTopFallbackDelayMs: 180,
  spacing: 'space-y-5',
  formClass: '',
  labels: {
	floating: false,
	base: [
	  'pointer-events-none absolute -top-1.5 left-0 text-xs font-medium text-dimmed transition-all',
	  'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-dimmed',
	  'peer-focus:-top-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-highlighted',
	],
  },
  fieldGroupHeader: 'mb-6 text-xl font-semibold',
  fieldGroup: 'mb-14 space-y-5',
  fieldInput: 'w-full',
  response: 'px-6 py-3 bg-muted rounded-lg italic',
  description: 'mb-2 text-sm text-muted',
  help: 'my-3 text-sm text-muted',
  submitAlign: '',
  submitComponent: '',
  submitButtonSize: '2xl',
  fieldVariant: 'outline',
},
```

- `formClass` applies classes to the root `UForm`, useful for downstream project scoping.
- `submitComponent` optionally names a globally registered custom submit action component. When empty or unresolved, the default `UButton` submit action is used.
- Most projects do not need a `webform` override. Override only values that genuinely differ from these defaults.
- `spacing` controls the root form rhythm, while `fieldGroup` controls fields inside each Drupal group and the space after that group. There is no separate `spacingLarge` setting.

Common downstream webform override:

```ts
stirTheme: {
  webform: {
    fieldVariant: 'material',
    submitButtonSize: 'xl',
    submitAlign: 'flex justify-center',
  },
},
```

---

## 🧩 `ui` (Nuxt UI Presets)

### 🎨 Colors

```ts
colors: {
  primary: 'lime',
  neutral: 'zinc',
},
```

### 🎛 Navigation Menu

```ts
navigationMenu: {
  slots: {
	link: 'font-medium text-md',
  },
  variants: {
	active: {
	  false: {
		link: 'text-highlighted',
	  },
	},
  },
  compoundVariants: [
	{
	  orientation: 'horizontal',
	  highlight: true,
	  class: {
		link: ['after:-bottom-1 after:h-[2px]'],
	  },
	},
	{
	  disabled: false,
	  active: false,
	  variant: 'pill',
	  class: {
		link: ['hover:text-primary bg-transparent'],
	  },
	},
	{
	  color: 'primary',
	  variant: 'pill',
	  active: true,
	  class: {
	    link: 'transition-all duration-300 text-primary',
	  },
	},
	{
	  variant: 'pill',
	  active: true,
	  highlight: false,
      class: {
	    link: 'before:bg-transparent hover:bg-transparent hover:text-red-500 after:h-px:after after:bg-red-500',
	  },
	},
  ],
},
```

The base layer owns its Nuxt UI defaults in `layers/theme/app/theme/nuxtUi.ts`
and composes that preset from `app.config.ts`. Consumer projects should override
only the Nuxt UI keys they need through `defineAppConfig`; they do not need to
import the Material implementation classes.

### 🔘 Buttons

```ts
button: {
  slots: {
	base: 'transition-all duration-300',
  },
  variants: {
	size: {
	  lg: {
		leadingIcon: 'size-6',
		trailingIcon: 'size-6'
	  },
	  md: {
		base: 'px-6 py-3 text-base gap-2',
		leadingIcon: 'size-8',
		trailingIcon: 'size-8'
	  },
	  '2xl': {
		  base: 'px-10 py-4 text-base gap-2',
		  leadingIcon: 'size-10',
		  trailingIcon: 'size-10'
	  },
	},
  },
  defaultVariants: {
	color: 'primary',
	variant: 'solid',
	size: 'xl',
  },
},
```

### 🧾 Form Fields

```ts
formField: {
  slots: {
	label: 'block font-medium text-dimmed',
	container: 'mt-1',
	error: 'mt-1 text-error',
  },
},
```

### 🧾 Inputs

```ts
input: {
  variants: {
	size: {
	  xl: {
		base: 'pt-4',
	  },
	},
  },
  defaultVariants: {
	size: 'xl',
  },
},
```

### 🧾 Selects

```ts
select: {
  variants: {
	size: {
	  xl: {
		base: 'pt-4',
	  },
	},
  },
  defaultVariants: {
	size: 'xl',
  },
},
selectMenu: {
  variants: {
	size: {
	  xl: {
		base: 'pt-4',
	  },
	},
  },
  defaultVariants: {
	size: 'xl',
  },
},
```

### 🧾 Textarea

```ts
textarea: {
  variants: {
	size: {
	  xl: {
		base: 'pt-4',
	  },
	},
  },
  defaultVariants: {
	size: 'xl',
	variant: 'material',
  },
},
```

### 🧾 Slideover

```ts
slideover: {
  variants: {
	side: {
	  right: {
		content: 'right-0 inset-y-0 w-full max-w-full',
	  },
	},
  },
},
```

### 🖼 Carousel (UI)

```ts
carousel: {
  variants: {
	orientation: {
	  horizontal: {
		item: 'ps-0',
		prev: '-start-12 top-1/2 -translate-y-1/2',
		next: '-end-12 top-1/2 -translate-y-1/2',
	  },
	},
  },
},
```

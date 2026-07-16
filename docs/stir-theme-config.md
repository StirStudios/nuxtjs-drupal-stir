## StirStudios Nuxt App Config Reference

This document outlines the full structure of the StirStudios `app.config.ts` file, including all relevant options under `colorMode`, `userway`, `stirTheme`, and the extended `ui` Nuxt UI presets.

---

### 🔧 `colorMode`

```ts
colorMode: {
  forced: false,
  preference: 'dark',
  showToggle: true,
  lightRoutes: ['/clients', '/book'],
  darkRoutes: ['/pricing'],
}
```

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
  redirectOnLogin: '/',
  requireLoginPaths: [],
  fallbackRedirectPath: '/',
}
```

### 🔑 `authIntegration`

```ts
authIntegration: {
  drupalAccounts: false,
}
```

- `drupalAccounts: false` disables Drupal account UI routes while keeping `/auth/protected` available.
- Set `drupalAccounts: true` only for sites that use the Drupal `stir_account` endpoints.
- Drupal `/api/auth/config` owns account-auth redirects, UI copy, and password policy.

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
}
```

Popup visibility should be controlled in Drupal block visibility settings
(Show/Hide for listed pages). Nuxt no longer applies route allow/block lists.

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
   `showPdf`, `showBreadcrumbs`, `heading`, `container`, `header`, `navigation`, `hero`, `footer`
2. Content/component behavior:
   `media`, `carousel`, `mediaModal`, `overlay`, `webform`, `turnstile`
3. Visual/system tokens and utilities:
   `card`, `gradients`, `animations`, `scrollButton`, `error`

### ✨ General

```ts
showPdf: false,
loadingIndicator: 'repeating-linear-gradient(to right,#D21B18 0%,#ED6663 50%,#F28E8D 100%)',
showBreadcrumbs: false,
heading: 'mb-20 text-center text-6xl',
header: 'md:px-auto fixed top-0 z-30 w-full !p-0',
```

### 🔗 `navigation`

```ts
navigation: {
  mode: 'fixed',
  modeRoutes: {
    sticky: ['/work*'],
  },
  logo: true,
  logoClass: 'h-[5rem]',
  hidden: false,
  transparentAtTop: false,
  base: 'h-auto transform py-3 duration-500',
  background: 'border-none bg-white/90 shadow backdrop-blur-md dark:bg-gray-950/70',
  color: 'primary',
  variant: 'link',
  desktopLayout: 'default', // 'default' or 'split-logo'
  logoMenuMarker: '--logo--',
  toggleDirection: 'right', // 'left' or 'right'
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

### 🏠 `frontPage`

```ts
frontPage: {
  heading: 'sr-only',
  main: 'mt-0',
}
```

### 📦 Layout

```ts
container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
```

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
]
```

### 🖼️ `media`

```ts
media: {
  base: 'relative h-full w-full overflow-hidden object-cover',
  rounded: 'rounded-xl',
  video: {
    loadMinWidth: 768,
    loadStrategy: 'after-load',
  },
},
```

Hero and bare background videos keep their poster in the initial HTML. Below
`media.video.loadMinWidth`, the poster remains static and the video is not
requested. At or above the breakpoint, the video source URL is deferred until
after the window load milestone. Set `loadMinWidth` to `0` to allow background
video at every viewport width. Set
`media.video.loadStrategy` to `'immediate'` only when a downstream project
intentionally accepts that performance tradeoff. The Drupal media payload
remains the source of truth for image loading,
priority, responsive derivatives, dimensions, and quality.

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
in a standard system location. Reports are written to the ignored
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
},
```

### 💥 Animations

```ts
animations: {
  once: false,
},
```

### 🧱 Grid separator

```ts
grid: {
  separator: {
	condition: 'node-',
	base: 'mt-16 mb-10 xl:mt-28 max-w-screen-sm lg:w-[20rem] mx-auto',
	color: 'white',
	type: 'solid',
	size: 'xs',
  },
},
```

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

### 🖼️ Carousel (StirTheme)

```ts
carousel: {
  padding: 'pb-12',
 root: '',
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
  spacingLarge: 'space-y-10',
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
  fieldGroup: 'space-y-10',
  fieldInput: 'w-full',
  response: 'px-6 py-3 bg-muted rounded-lg italic',
  description: 'desc mb-3 text-muted',
  help: 'desc my-3 text-muted',
  submitAlign: '',
  submitComponent: '',
  submitButtonSize: '2xl',
  fieldVariant: 'outline',
},
```

- `formClass` applies classes to the root `UForm`, useful for downstream project scoping.
- `submitComponent` optionally names a globally registered custom submit action component. When empty or unresolved, the default `UButton` submit action is used.

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
		base: 'px-6 py-3 text-md gap-2',
		leadingIcon: 'size-8',
		trailingIcon: 'size-8'
	  },
	  '2xl': {
		  base: 'px-10 py-4 text-md gap-2',
		  leadingIcon: 'size-10',
		  trailingIcon: 'size-10'
	  },
	},
	variant: {
	  material: materialVariantMuted,
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
	variant: {
	  material: materialVariant,
	},
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
	variant: {
	  material: materialVariantWithPB,
	},
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
	variant: {
	  material: materialVariantWithPB,
	},
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
	variant: {
	  material: materialVariant,
	},
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

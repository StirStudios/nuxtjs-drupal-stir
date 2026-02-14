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
- Route arrays use prefix matching for non-root entries (e.g. `'/pricing'` matches `/pricing` and child paths).
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
  position: 3,
  size: 'small', // or 'medium' | 'large'
  color: '#ffffff',
  type: '1',
}
```

### 🔐 `protectedRoutes`

```ts
protectedRoutes: {
  loginPath: '/login',
  redirectOnLogin: '/example',
  requireLoginPaths: [
	'/example',
	'/admin/',
  ],
  loginHeading: 'Login',
}
```

### 📊 `analytics`

```ts
analytics: {
  plausible: {
	enabled: false,
	domain: 'domainname.com', // without https://www
	scriptUrl: 'https://analytics.stirstudiosdesign.com/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js',
  },
}
```

### 💬 `popup`

```ts
popup: {
  enabled: false, // global mount switch for <LazyAppPopup />
}
```

### 🍪 `cookieConsent`

```ts
cookieConsent: {
  enabled: false,
  title: 'We value your privacy',
  message: 'We use cookies to enhance your experience and collect the information you provide through our booking forms to help plan your wedding. We do not sell your data.',
  messageLinks: 'For more information please review our',
  termsUrl: '/terms',
  privacyUrl: '/privacy',
  buttonLabel: 'Accept',
}
```

---

## 🎨 `stirTheme`

Recommended key order in `stirTheme`:

1. Global flags and layout primitives:
   `pdf`, `crumbs`, `h1`, `container`, `header`, `navigation`, `hero`, `footer`
2. Content/component behavior:
   `media`, `carousel`, `modal`, `webform`, `turnstile`
3. Visual/system tokens and utilities:
   `card`, `gradients`, `animations`, `aspectRatios`, `scrollButton`, `error`

### ✨ General

```ts
pdf: false,
loadingIndicator: 'repeating-linear-gradient(to right,#D21B18 0%,#ED6663 50%,#F28E8D 100%)',
crumbs: false,
h1: 'mb-20 text-center text-6xl',
header: 'md:px-auto fixed top-0 z-30 w-full !p-0',
```

### 🔗 `navigation`

```ts
navigation: {
  mode: 'fixed',
  logo: true,
  logoSize: 'h-[5rem]',
  isHidden: false,
  transparentTop: false,
  base: 'h-auto transform py-3 duration-500',
  background: 'border-none bg-white/90 shadow backdrop-blur-md dark:bg-gray-950/70',
  color: 'primary',
  variant: 'link',
  toggleType: 'slideover', // 'modal', 'slideover' or 'drawer'
  toggleDirection: 'right', // 'left' or 'right'
  highlight: {
	show: false,
	color: 'primary',
  },
  slideover: {
	logo: true,
	link: 'text-xl text-center block my-3 uppercase',
	body: 'flex h-full flex-col justify-center text-center',
  },
}
```

### 🏠 `front`

```ts
front: {
  h1: 'sr-only',
  main: 'mt-0',
}
```

### 📦 Layout

```ts
container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
```

### 🦶 `footer`

```ts
footer: {
  hideEmail: false,
  base: 'mt-20 bg-accented dark:bg-muted/50 py-10 text-default text-sm',
  left: 'text-sm leading-relaxed lg:text-left',
  right: 'lg:items-end flex flex-col items-center gap-2 lg:text-right',
  footerLinks: 'transition-colors text-primary hover:text-primary/90',
  poweredby: true, // Hide powered by
  rights: '', // Add additional rights
}
```

### 🌐 `socials`

```ts
socials: [
  {
    title: 'IMDB',
    url: '//imdb.com/name/CLIENT/',
    icon: 'i-social-icons:imdb',
    iconSize: 'size-10',
  },
  {
    title: 'LinkedIn',
    url: '//linkedin.com/in/CLIENT',
    icon: 'i-social:linkedin',
    iconSize: 'size-10',
  },
]
```

### 🖼️ `media` & aspect ratios

```ts
media: {
  base: 'relative h-full w-full overflow-hidden object-cover',
  rounded: 'rounded-xl',
},
aspectRatios: {
  portrait: 'aspect-[9/16]',
  landscape: 'aspect-[16/9]',
  square: 'aspect-square',
  fourThree: 'aspect-[4/3]',
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

### 🧊 Modal

```ts
modal: { header: true },
```

### 🧊 Error

```ts
error: {
  label: 'Take me back home',
  color: 'primary',
  variant: 'solid'
},
```

### 🧊 Scroll

```ts
scrollButton: {
  base: 'fixed bottom-4 left-4 z-50 rounded-full p-2 shadow-md transition-opacity duration-300',
  icon: 'i-lucide:arrow-up',
  variant: 'solid',
  showAtScrollY: 200,
},
```

### 🧊 Turnstile

```ts
turnstile: {
  appearance: 'always',
  label: 'Let us know you’re human',
},
```

### 🧊 Webform

```ts
webform: {
  spacing: 'space-y-5',
  spacingLarge: 'space-y-10',
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
  buttonSize: '2xl',
  variant: 'outline',
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

# Debugging navigation flicker

When something in the persistent layout (header, editor bar, menus) blinks or
shifts on client navigation, measure before changing code. Two probes found the
account-menu blink in 2026; guesses from reading the code did not.

Run them in the browser console, on the page where the flicker shows, as the
user who sees it (the editor bar only exists for editors). **Start from the
second client navigation after a page load:** Nuxt carries the hydrated layout
into the first navigation only, so a single navigation from a fresh load can
look clean while every later one flickers.

## 1. Timeline of DOM changes

A `MutationObserver` records every change to one element, even in a hidden tab
where `requestAnimationFrame` sampling stops. Log the state you suspect next to
each change, and check whether the element itself was replaced.

```js
(async () => {
  const nuxt = document.querySelector('#__nuxt').__vue_app__.$nuxt
  const target = document.querySelector('[aria-label="Drupal administration"]')
  const log = []
  const t0 = performance.now()
  const snap = why => log.push(`${(performance.now() - t0).toFixed(0)}ms ${why} same=${document.querySelector('[aria-label="Drupal administration"]') === target} items=${target.querySelectorAll('li').length}`)
  const mo = new MutationObserver(() => snap('dom'))
  mo.observe(target, { subtree: true, childList: true, characterData: true })
  snap('start')
  await nuxt.$router.push('/next-page')
  await new Promise(r => setTimeout(r, 1500))
  mo.disconnect()
  console.log(log.join('\n'))
})()
```

## 2. Synchronous watchers with call stacks

Values can change and change back within one tick, which a timeline never
sees. A `flush: 'sync'` watcher runs inside the call that changes the value,
so its stack names the culprit. Reach a component's state through its DOM
element's `__vueParentComponent` (development builds), and watch payload data
directly.

```js
(async () => {
  const nuxt = document.querySelector('#__nuxt').__vue_app__.$nuxt
  let inst = document.querySelector('[aria-label="Drupal administration"]').__vueParentComponent
  while (inst && !(inst.setupState && 'accountMenuKey' in inst.setupState)) inst = inst.parent
  const out = []
  const t0 = performance.now()
  const watchSync = (label, get) => inst.proxy.$watch(get, (next, prev) => out.push(
    `${(performance.now() - t0).toFixed(0)}ms ${label}: ${JSON.stringify(prev)} -> ${JSON.stringify(next)}\n  `
    + new Error().stack.split('\n').slice(2, 14).join('\n  ')), { flush: 'sync' })
  const stops = [
    watchSync('accountMenuKey', () => inst.setupState.accountMenuKey),
    watchSync('menu', () => String(nuxt.payload.data['menu-account--' + inst.setupState.accountMenuKey]?.length)),
  ]
  await nuxt.$router.push('/next-page')
  await new Promise(r => setTimeout(r, 1500))
  stops.forEach(stop => stop())
  console.log(out.join('\n\n') || 'no changes')
})()
```

A stack that runs through a component's `setup` means a new instance was
created, not that the visible one changed. For the layout, check what the
route carries when a navigation is confirmed:
`nuxt.$router.afterEach(to => console.log(to.meta.layout))`. It must name the
current layout, never `undefined`, or `NuxtLayout` builds `default` in between
(`tests/nuxt/runtime/drupalPageLayout.nuxt.spec.ts`).

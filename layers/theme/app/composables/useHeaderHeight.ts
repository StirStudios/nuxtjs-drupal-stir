/**
 * Publishes the fixed header's top-of-page height as `--ui-header-height` on
 * the root element, so hero padding and any `calc(var(--ui-header-height)...)`
 * follow header customisation. Only the unscrolled state is measured: the
 * value is kept while the header shrinks, so content does not move on scroll.
 * `height` is an optional configured length emitted in the server HTML.
 */
export function useHeaderHeight(
  header: Ref<HTMLElement | null>,
  scrolled: Ref<boolean>,
  height?: string,
) {
  if (height) useHead({ style: [{ innerHTML: `:root{--ui-header-height:${height}}` }] })

  if (!import.meta.client) return

  let observer: ResizeObserver | undefined
  const publish = () => {
    if (scrolled.value || !header.value) return
    document.documentElement.style.setProperty('--ui-header-height', `${header.value.offsetHeight}px`)
  }

  onMounted(() => {
    observer = new ResizeObserver(publish)
    if (header.value) observer.observe(header.value)
    publish()
  })
  watch(scrolled, publish)
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.documentElement.style.removeProperty('--ui-header-height')
  })
}

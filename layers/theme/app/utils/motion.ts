/**
 * Whether this viewer asked the system to reduce motion.
 *
 * Use this for one-off decisions, such as picking a scroll behaviour. Code
 * that must react when the preference changes should watch a live media
 * query instead; see useDeferredVideoSource.
 */
export function prefersReducedMotion(): boolean {
  return import.meta.client
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Scrolls an element into view, instantly for viewers who prefer reduced motion.
 */
export function scrollIntoViewGently(
  element: Element | null | undefined,
  block: ScrollLogicalPosition = 'nearest',
): void {
  element?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block,
  })
}

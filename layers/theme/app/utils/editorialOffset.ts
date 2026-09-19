/**
 * The space Drupal's editorial tabs bar takes at the top of the viewport.
 *
 * The editorial layer publishes the height as a CSS variable while its tabs
 * bar is mounted, so the theme offsets the header without knowing whether that
 * layer is installed or who may see it. Sites without the bar fall back to 0.
 */
export const STIR_EDITORIAL_OFFSET_VAR = '--stir-editorial-offset'

/** The value the tabs bar publishes while it is on screen. */
export const STIR_EDITORIAL_OFFSET = '3.1rem'

/**
 * Extra scrolling allowed before the header reacts while the bar is shown.
 */
export const STIR_EDITORIAL_SCROLL_ALLOWANCE = 40

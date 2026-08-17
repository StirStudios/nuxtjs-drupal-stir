/**
 * Drupal Canvas image value emitted by nuxt-component-preview.
 *
 * The preview module also auto-imports this type for consuming Nuxt apps.
 * Declaring the shape globally keeps the standalone Stir layer type-safe when
 * it is checked without the preview module being active.
 */
interface CanvasImage {
  src: string
  alt: string
  width: number
  height: number
}


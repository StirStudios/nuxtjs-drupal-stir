import { useNuxt } from '@nuxt/kit'

/** Replace a platform placeholder without outranking a consumer component. */
export function overrideFallbackComponent(
  name: string,
  fallback: string,
  replacement: string,
): void {
  useNuxt().hook('components:extend', (components) => {
    const component = components.find(component =>
      component.pascalName === name && component.filePath === fallback,
    )

    if (component) {
      component.filePath = replacement
      component.declarationPath = replacement
      component.shortPath = replacement
    }
  })
}

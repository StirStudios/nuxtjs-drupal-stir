import { useNuxt } from '@nuxt/kit'

/**
 * Replace a platform placeholder without outranking a consumer component.
 * `when` can limit the swap to builds whose registered components allow it.
 */
export function overrideFallbackComponent(
  name: string,
  fallback: string,
  replacement: string,
  when: (components: { pascalName: string }[]) => boolean = () => true,
): void {
  useNuxt().hook('components:extend', (components) => {
    if (!when(components)) return

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

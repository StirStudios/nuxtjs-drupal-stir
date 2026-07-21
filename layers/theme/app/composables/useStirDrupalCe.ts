import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'

export function useStirDrupalCe() {
  const drupal = useDrupalCe()

  if (!import.meta.dev) return drupal

  const prepare = (content: CustomElementContent): CustomElementContent =>
    typeof drupal.resolveCustomElement === 'function'
      ? prepareComponentTreeForDevelopment(
          content,
          drupal.resolveCustomElement,
        ) as CustomElementContent
      : content

  return {
    ...drupal,
    renderCustomElements: (content: CustomElementContent) =>
      drupal.renderCustomElements(prepare(content)),
    renderCustomElementsToVNodes: (content: CustomElementContent) =>
      drupal.renderCustomElementsToVNodes(prepare(content)),
  }
}

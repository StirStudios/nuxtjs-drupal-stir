import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'

export function useStirDrupalCe() {
  const drupal = useDrupalCe()

  const prepare = (content: CustomElementContent): CustomElementContent =>
    typeof drupal.resolveCustomElement === 'function'
      ? prepareComponentTreeForDevelopment(
          content,
          drupal.resolveCustomElement,
          import.meta.dev,
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

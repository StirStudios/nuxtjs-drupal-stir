import { withoutPresentationEditMetadata } from '../utils/layoutEditLinks'
import type { DrupalElementContent } from './useDrupalElements'
import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'

export function useStirDrupalCe() {
  const elements = useDrupalElements()
  const pages = useDrupalPage()

  const prepare = (content: unknown): DrupalElementContent =>
    prepareComponentTreeForDevelopment(
      withoutPresentationEditMetadata(content),
      elements.resolveCustomElement,
      import.meta.dev,
    ) as DrupalElementContent

  return {
    ...elements,
    fetchPage: pages.fetchPage,
    getPage: pages.getPage,
    getMessages: pages.getMessages,
    renderCustomElements: (content: unknown) =>
      elements.renderCustomElements(prepare(content)),
    renderCustomElementsToVNodes: (content: unknown) =>
      elements.renderCustomElementsToVNodes(prepare(content)),
  }
}

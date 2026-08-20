import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'
import type { AppContextPayload } from '../../../core/shared/types/appContext'
import type { DrupalNodeRelatedItem } from '../types/Node'

type DrupalComposable = ReturnType<typeof useDrupalCe>
type DrupalPageRef = ReturnType<DrupalComposable['getPage']>
type DrupalPage = DrupalPageRef['value']
type StirPageContent = {
  element?: string
  props?: Record<string, unknown> & {
    hide?: boolean | string
    title?: string
  }
  slots?: Record<string, unknown>
  [key: string]: unknown
}
type StirDrupalPage = Omit<DrupalPage, 'content'> & Partial<AppContextPayload> & {
  content?: StirPageContent
  current_user?: Record<string, unknown> | null
  is_front_page?: boolean
  local_tasks?: Record<string, unknown> | null
  published?: boolean
  related?: {
    prevNode?: DrupalNodeRelatedItem | null
    nextNode?: DrupalNodeRelatedItem | null
  }
}

export function useStirDrupalCe() {
  const drupal = useDrupalCe()

  const prepare = (content: unknown): CustomElementContent =>
    typeof drupal.resolveCustomElement === 'function'
      ? prepareComponentTreeForDevelopment(
          content as CustomElementContent,
          drupal.resolveCustomElement,
          import.meta.dev,
        ) as CustomElementContent
      : content as CustomElementContent

  return {
    ...drupal,
    fetchPage: (...args: Parameters<DrupalComposable['fetchPage']>) =>
      drupal.fetchPage(...args) as Promise<Ref<StirDrupalPage>>,
    getPage: (...args: Parameters<DrupalComposable['getPage']>) =>
      drupal.getPage(...args) as Ref<StirDrupalPage>,
    renderCustomElements: (content: unknown) =>
      drupal.renderCustomElements(prepare(content)),
    renderCustomElementsToVNodes: (content: unknown) =>
      drupal.renderCustomElementsToVNodes(prepare(content)),
  }
}

import { withoutPresentationEditMetadata } from '../utils/layoutEditLinks'
import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'
import type { AppContextPayload } from '../../../core/shared/types/appContext'
import type { DrupalNodeRelatedItem } from '../types/Node'
import type {
  StirDrupalCurrentUser,
  StirDrupalLocalTasks,
} from '../types/DrupalPageUser'

type DrupalComposable = ReturnType<typeof useDrupalCe>
type DrupalPage = ReturnType<DrupalComposable['getPage']>['value']
type StirPageContent = {
  element?: string
  props?: Record<string, unknown> & {
    hideTitle?: boolean | string
    title?: string
  }
  slots?: Record<string, unknown>
  [key: string]: unknown
}
type StirDrupalPage = Omit<DrupalPage, 'content'> & Partial<AppContextPayload> & {
  content?: StirPageContent
  current_user?: StirDrupalCurrentUser | null
  is_front_page?: boolean
  local_tasks?: Partial<StirDrupalLocalTasks> | null
  published?: boolean
  related?: {
    prevNode?: DrupalNodeRelatedItem | null
    nextNode?: DrupalNodeRelatedItem | null
  }
}

export function useStirDrupalCe() {
  const drupal = useDrupalCe()

  const prepare = (content: unknown): CustomElementContent => {
    const renderable = withoutPresentationEditMetadata(content) as CustomElementContent

    return typeof drupal.resolveCustomElement === 'function'
      ? prepareComponentTreeForDevelopment(
          renderable,
          drupal.resolveCustomElement,
          import.meta.dev,
        ) as CustomElementContent
      : renderable
  }

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

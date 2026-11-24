import { withoutPresentationEditMetadata } from '../utils/layoutEditLinks'
import type { DrupalElementContent } from './useDrupalElements'
import { prepareComponentTreeForDevelopment } from '../utils/componentTreeDiagnostics'
import type { AppContextPayload } from '../../../core/shared/types/appContext'
import type { DrupalNodeRelatedItem } from '../types/Node'
import type {
  StirDrupalCurrentUser,
  StirDrupalLocalTasks,
} from '../types/DrupalPageUser'

// The page Drupal CE sends (the shape nuxtjs-drupal-ce typed as DrupalCePage).
type DrupalPage = {
  breadcrumbs: Array<{ label: string, url?: string, frontpage?: boolean }>
  content: DrupalElementContent | Record<string, unknown>
  content_format: string
  local_tasks: { primary: unknown[], secondary: unknown[] }
  settings: Record<string, unknown>
  messages: unknown[]
  metatags: { meta: Array<Record<string, string>>, link: Array<Record<string, string>>, jsonld: unknown[] }
  page_layout: string
  title: string
  key?: string
}
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
    fetchPage: (...args: Parameters<typeof pages.fetchPage>) =>
      pages.fetchPage(...args) as Promise<Ref<StirDrupalPage>>,
    getPage: (customKey?: string) =>
      pages.getPage(customKey) as unknown as Ref<StirDrupalPage>,
    getMessages: pages.getMessages,
    renderCustomElements: (content: unknown) =>
      elements.renderCustomElements(prepare(content)),
    renderCustomElementsToVNodes: (content: unknown) =>
      elements.renderCustomElementsToVNodes(prepare(content)),
  }
}

import type { AppContextPayload } from '../../../core/shared/types/appContext'
import type { DrupalNodeRelatedItem } from './Node'
import type { StirDrupalCurrentUser, StirDrupalLocalTasks } from './DrupalPageUser'

/** The page element Drupal CE sends as `content`. */
export type StirPageContent = {
  element?: string
  props?: Record<string, unknown> & {
    hideTitle?: boolean | string
    title?: string
  }
  slots?: Record<string, unknown>
  [key: string]: unknown
}

/** A page from the Drupal CE API, as `useStirDrupalCe().getPage()` returns it. */
export type StirDrupalPage = Partial<AppContextPayload> & {
  breadcrumbs: Array<{ label: string, url?: string, frontpage?: boolean }>
  content?: StirPageContent
  content_format: string
  current_user?: StirDrupalCurrentUser | null
  is_front_page?: boolean
  key?: string
  local_tasks?: Partial<StirDrupalLocalTasks> | null
  /** Drupal status messages: grouped by type, or an empty list. */
  messages: { error?: string[], success?: string[] } | unknown[]
  metatags: { meta: Array<Record<string, string>>, link: Array<Record<string, string>>, jsonld: unknown[] }
  page_layout: string
  published?: boolean
  redirect?: { url: string, statusCode?: number, external?: boolean }
  related?: {
    prevNode?: DrupalNodeRelatedItem | null
    nextNode?: DrupalNodeRelatedItem | null
  }
  settings?: Record<string, unknown>
  title: string
}

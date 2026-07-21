import type { ComponentTreeNode } from './componentTree'

export type AppContextBlock = ComponentTreeNode

export type AppContextRegions = Record<string, AppContextBlock[]>

export type AppContextFooterMenuItem = {
  title: string
  url: string
}

export type AppContextSiteInfo = {
  name: string
  mail: string
  slogan: string
}

export type AppContextPayload = {
  blocks: AppContextRegions
  footer_menu: AppContextFooterMenuItem[]
  site_info: AppContextSiteInfo
}

export type AppContextProducerPayload = Omit<AppContextPayload, 'blocks'> & {
  blocks: AppContextRegions | []
}

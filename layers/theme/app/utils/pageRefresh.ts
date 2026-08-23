import type { InjectionKey } from 'vue'

export type PageRefresh = () => Promise<void>

export const pageRefreshKey: InjectionKey<PageRefresh> = Symbol('stir-page-refresh')

export type GlobalSeoAttributes = Record<string, string>

export interface GlobalSeoProducerPayload {
  lang: string
  meta: GlobalSeoAttributes[]
  link: GlobalSeoAttributes[]
}

export interface GlobalSeoResponse {
  lang?: string
  meta: GlobalSeoAttributes[]
  link: GlobalSeoAttributes[]
}

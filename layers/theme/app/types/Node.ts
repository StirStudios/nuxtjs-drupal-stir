export type DrupalNodePath = {
  alias: string
  pid?: string
  langcode?: string
}

export interface DrupalNodeRelatedItem {
  nid: string
  title: string
  url: string
}

export interface NodeCommonProps {
  title: string
  summary?: string
  url?: string
  type?: string
  isArticle?: boolean | string
  editLink?: string
  created?: string
  uid?: string | object
  hideTitle?: boolean | string
  path?: DrupalNodePath
  pageAnimation?: string
  pageAnimationStagger?: boolean | number | string
}

export interface NodeDefaultProps extends NodeCommonProps {
  related?: {
    prevNode?: DrupalNodeRelatedItem | null
    nextNode?: DrupalNodeRelatedItem | null
  }
}

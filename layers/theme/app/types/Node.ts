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
  url?: string
  type?: string
  isArticle?: boolean | string
  editLink?: string
  created?: string
  uid?: string | object
  hide?: boolean | string
  path?: DrupalNodePath
}

export interface NodeDefaultProps extends NodeCommonProps {
  related?: {
    prevNode?: DrupalNodeRelatedItem | null
    nextNode?: DrupalNodeRelatedItem | null
  }
}

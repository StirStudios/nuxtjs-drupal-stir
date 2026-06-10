import type { WebformDefinition } from './Form'
import type { CustomElementNode } from './CustomElements'

export type PopupNode = CustomElementNode

export type PopupProps = {
  id?: string | number
  uuid?: string
  parentUuid?: string
  region?: string
  text?: string
  webform?: WebformDefinition
  editLink?: string
  direction?: string
}

export type PopupMedia = Record<string, unknown>

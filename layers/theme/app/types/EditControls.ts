export type EditActionKey = 'quick' | 'full' | 'layout'

export interface EditAction {
  key: EditActionKey
  tooltip: string
  ariaLabel: string
  icon: string
  variant: 'soft' | 'outline'
  buttonClass: string
  disabled?: boolean
  to?: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
}

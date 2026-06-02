import type { ComputedRef, InjectionKey } from 'vue'

export type AuthLayout = 'card' | 'page-split' | 'card-split'
export type AuthImagePosition = 'left' | 'right'

export const defaultAuthLayout: AuthLayout = 'card'
export const defaultAuthImagePosition: AuthImagePosition = 'left'

export type AuthLayoutContext = {
  layout: AuthLayout
  imagePosition: AuthImagePosition
  image: string
  showIcon: boolean
}

export const resolveAuthLayout = (value: unknown): AuthLayout | undefined => {
  switch (value) {
    case 'card':
    case 'page-split':
    case 'card-split':
      return value
    default:
      return undefined
  }
}

export const resolveAuthImagePosition = (value: unknown): AuthImagePosition | undefined => {
  switch (value) {
    case 'left':
    case 'right':
      return value
    default:
      return undefined
  }
}

export const authLayoutContextKey: InjectionKey<ComputedRef<AuthLayoutContext>> =
  Symbol('authLayoutContext')

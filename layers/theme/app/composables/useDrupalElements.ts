import type { Component, Ref, VNode } from 'vue'
import { Fragment } from 'vue'
import type { UseFetchOptions } from '#app'
import type { DrupalMenuTreeItem } from '../utils/navigation'
import { NuxtErrorBoundary } from '#components'
import { resolveDrupalCeConfig } from '../../../foundation/shared/utils/drupalCeConfig'

/** A Drupal Custom Elements node in the explicit format Stir Tools sends. */
export type DrupalElementContent =
  | string
  | null
  | undefined
  | DrupalElementContent[]
  | {
      element?: string
      props?: Record<string, unknown> | unknown[]
      slots?: Record<string, DrupalElementContent>
    }

type DrupalMetatags = {
  meta?: Record<string, unknown>[]
  link?: Record<string, unknown>[]
  jsonld?: unknown
}
type DrupalPageHead = { title?: string, metatags?: DrupalMetatags }

const CE_PROXY = '/api/drupal-ce'
const MENU_PROXY = '/api/menu'

const pascalCase = (name: string) =>
  name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')

const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && value !== null && Boolean((value as { name?: unknown }).name)

/**
 * Renders Drupal custom elements as the layer's components, fetches menus and
 * Drupal API data through the layer's proxy, and applies Drupal metatags.
 *
 * `paragraph-hero` renders `ParagraphHero`. Without an exact component, the
 * name loses trailing segments until a `<Prefix>Default` matches
 * (`paragraph-carousel-item` → `ParagraphCarouselDefault` → `ParagraphDefault`).
 */
export function useDrupalElements() {
  const nuxtApp = useNuxtApp()
  const { menuEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  function resolveCustomElement(element: string): Component | null {
    const exact = nuxtApp.vueApp.component(pascalCase(element))

    if (isComponent(exact)) return exact

    let name = element

    while (name) {
      const fallback = nuxtApp.vueApp.component(`${pascalCase(name)}Default`)

      if (isComponent(fallback)) return fallback

      const shorter = name.replace(/-?[^-]+$/, '')

      if (shorter === name) break
      name = shorter
    }

    const registered = resolveComponent(element)

    return isComponent(registered) ? registered : null
  }

  type Rendered = VNode | null | Rendered[]

  function renderCustomElementsToVNodes(content: DrupalElementContent, inBoundary = false): Rendered {
    if (content == null) return null
    if (typeof content === 'string') {
      const markup = resolveCustomElement('drupal-markup')

      return markup ? h(markup, { content }) : h('div', content)
    }
    if (Array.isArray(content)) {
      return content.map(item => renderCustomElementsToVNodes(item, inBoundary))
    }
    if (!content.element) return null

    const component = resolveCustomElement(content.element)

    if (!component) return null

    // A paragraph that throws drops out of the page, which still renders.
    // Only the outermost paragraphs get a boundary: each one buffers its
    // server output and keeps a payload entry.
    const isBoundary = !inBoundary && content.element.startsWith('paragraph-')
    // Drupal sends an empty PHP array as [] instead of {}.
    const props = Array.isArray(content.props) ? {} : (content.props ?? {})
    const slots = Object.fromEntries(Object.entries(content.slots ?? {}).map(([name, slot]) =>
      [name, () => renderCustomElementsToVNodes(slot, inBoundary || isBoundary)]))
    const render = () => h(component, props, slots)

    return isBoundary ? h(NuxtErrorBoundary, null, { default: render, error: () => null }) : render()
  }

  function renderCustomElements(content: DrupalElementContent): VNode | null {
    const nodes = renderCustomElementsToVNodes(content)

    return Array.isArray(nodes) ? h(Fragment, nodes as VNode[]) : nodes
  }

  /** A client for Drupal CE API paths, through the layer's proxy. */
  const $ceApi = () => $fetch.create({
    baseURL: CE_PROXY,
    credentials: 'include',
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
  })

  /**
   * Fetches a Drupal menu by machine name through the layer's proxy. `data`
   * is the menu tree, or an empty list before it loads or if the fetch fails.
   */
  function useMenu<T = DrupalMenuTreeItem>(name: string, options: Omit<UseFetchOptions<T[]>, 'default'> = {}) {
    const path = menuEndpoint.replace('$$$NAME$$$', name).replace(/^\/+/, '')

    return useFetch<T[]>(path, {
      key: `menu-${name}--${path}`,
      baseURL: MENU_PROXY,
      credentials: 'include',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      getCachedData: (key: string) => nuxtApp.payload.data[key] as T[] | undefined,
      ...options,
      default: () => [],
    })
  }

  /** Applies a Drupal page's title and metatags to the document head. */
  function usePageHead(page: Ref<DrupalPageHead>, include: Array<'title' | 'meta' | 'link' | 'jsonld'> = ['title', 'meta', 'link', 'jsonld']) {
    useHead(() => ({
      ...(include.includes('title') && { title: page.value.title }),
      ...(include.includes('meta') && { meta: page.value.metatags?.meta }),
      ...(include.includes('link') && { link: page.value.metatags?.link }),
      ...(include.includes('jsonld') && {
        script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(page.value.metatags?.jsonld ?? []) }],
      }),
    }) as never)
  }

  return {
    $ceApi,
    renderCustomElements,
    renderCustomElementsToVNodes,
    resolveCustomElement,
    useMenu,
    usePageHead,
  }
}

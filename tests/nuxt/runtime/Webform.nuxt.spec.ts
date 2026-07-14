import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import Webform from '../../../layers/theme/app/components/global/Paragraph/Webform.vue'

describe('Webform (Nuxt runtime)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defers validation until the form approaches the viewport', async () => {
    const observers: Array<{
      callback: IntersectionObserverCallback
      disconnect: ReturnType<typeof vi.fn>
      observed: Element[]
      options?: IntersectionObserverInit
    }> = []

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        callback: IntersectionObserverCallback
        disconnect = vi.fn()
        observed: Element[] = []
        options?: IntersectionObserverInit

        constructor(
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          this.callback = callback
          this.options = options
          observers.push(this)
        }

        observe(element: Element) {
          this.observed.push(element)
        }
      },
    )

    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          actions: [{ '#type': 'submit', '#title': 'Submit' }],
          fields: {
            name: {
              '#name': 'name',
              '#required': true,
              '#title': 'Name',
              '#type': 'text',
            },
          },
          webformConfirmation: 'Thank you',
          webformId: 'contact',
          webformSubmissions: '',
          webformTitle: 'Contact',
        },
      },
    })
    const formObserver = observers.find(({ observed }) =>
      observed.some((element) => element.tagName === 'FORM'),
    )

    expect(formObserver).toBeDefined()
    expect(formObserver?.options?.rootMargin).toBe('0px')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    formObserver?.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    await flushPromises()

    await vi.waitFor(() => {
      expect(formObserver?.disconnect).toHaveBeenCalled()
      expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    })
  })
})

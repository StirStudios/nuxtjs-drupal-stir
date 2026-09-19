import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SiteMessages from '../../../layers/theme/app/components/Site/Messages.vue'

const shared = vi.hoisted(() => ({
  queue: null as null | { value: Array<{ message: string, type: string }> },
  toastAdd: vi.fn(),
}))

mockNuxtImport('useStirDrupalCe', () => () => ({
  getMessages: () => shared.queue,
}))
mockNuxtImport('useToast', () => () => ({ add: shared.toastAdd }))

describe('Site/Messages', () => {
  it('shows messages that arrive after mount, including repeats, and drains them', async () => {
    shared.queue = ref([{ type: 'success', message: 'Saved' }])
    shared.toastAdd.mockClear()

    await mountSuspended(SiteMessages)
    await vi.waitFor(() => expect(shared.toastAdd).toHaveBeenCalledTimes(1))
    expect(shared.queue.value).toEqual([])

    // A later navigation queues the same text again; it must show again.
    shared.queue.value.push({ type: 'success', message: 'Saved' }, { type: 'error', message: 'Failed' })

    await vi.waitFor(() => expect(shared.toastAdd).toHaveBeenCalledTimes(3))
    expect(shared.toastAdd.mock.calls[2]?.[0]).toMatchObject({ title: 'Error!', color: 'error' })
    expect(shared.queue.value).toEqual([])
  })
})

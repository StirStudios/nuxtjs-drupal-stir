import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useAccountSettings } from '../../../layers/auth/app/composables/account/useAccountSettings'

const wrappers: Array<{ unmount: () => void }> = []

const mountComposable = async () => {
  let settings: ReturnType<typeof useAccountSettings> | undefined
  const Harness = defineComponent({
    setup() {
      settings = useAccountSettings()
      return () => null
    },
  })

  wrappers.push(await mountSuspended(Harness))

  if (!settings) {
    throw new Error('Account settings composable was not initialized.')
  }

  return settings
}

describe('useAccountSettings', () => {
  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('requires and sends the current password only for a protected email change', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        fields: {
          account_email: {
            editable: true,
            requires_current_password: true,
          },
        },
        values: { account_email: 'before@example.test' },
      })
      .mockResolvedValueOnce({
        updated: true,
        updated_fields: ['account_email'],
      })

    vi.stubGlobal('$fetch', fetchMock)

    const settings = await mountComposable()

    await settings.load()
    expect(settings.requiresCurrentPassword.value).toBe(false)

    settings.values.value.account_email = 'after@example.test'
    expect(settings.requiresCurrentPassword.value).toBe(true)
    settings.values.value.current_password = 'correct horse battery staple'

    await expect(settings.save()).resolves.toMatchObject({ updated: true })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/account/settings/values',
      {
        method: 'PATCH',
        body: {
          values: {
            account_email: 'after@example.test',
            current_password: 'correct horse battery staple',
          },
        },
      },
    )
    expect(settings.values.value.current_password).toBe('')
    expect(settings.requiresCurrentPassword.value).toBe(false)
  })

  it('does not send the current password when Drupal does not require it', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        fields: {
          account_email: {
            editable: true,
            requires_current_password: false,
          },
        },
        values: { account_email: 'before@example.test' },
      })
      .mockResolvedValueOnce({ updated: true })

    vi.stubGlobal('$fetch', fetchMock)

    const settings = await mountComposable()

    await settings.load()
    settings.values.value.account_email = 'after@example.test'
    settings.values.value.current_password = 'not-required'
    await settings.save()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/account/settings/values',
      {
        method: 'PATCH',
        body: {
          values: { account_email: 'after@example.test' },
        },
      },
    )
  })

  it('rejects a protected email change without the current password', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      fields: {
        account_email: {
          editable: true,
          requires_current_password: true,
        },
      },
      values: { account_email: 'before@example.test' },
    })

    vi.stubGlobal('$fetch', fetchMock)

    const settings = await mountComposable()

    await settings.load()
    settings.values.value.account_email = 'after@example.test'

    await expect(settings.save()).rejects.toThrow(
      'Current password is required to change your email address.',
    )
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(settings.saving.value).toBe(false)
  })

  it('keeps the current password when the update request fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        fields: {
          account_email: {
            editable: true,
            requires_current_password: true,
          },
        },
        values: { account_email: 'before@example.test' },
      })
      .mockRejectedValueOnce(new Error('Update failed'))

    vi.stubGlobal('$fetch', fetchMock)

    const settings = await mountComposable()

    await settings.load()
    settings.values.value.account_email = 'after@example.test'
    settings.values.value.current_password = 'keep-until-retry'

    await expect(settings.save()).rejects.toThrow('Update failed')
    expect(settings.values.value.current_password).toBe('keep-until-retry')
  })

  it('ignores an email address change that only changes letter case', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      fields: {
        account_email: {
          editable: true,
          requires_current_password: true,
        },
      },
      values: { account_email: 'Person@Example.test' },
    })

    vi.stubGlobal('$fetch', fetchMock)

    const settings = await mountComposable()

    await settings.load()
    settings.values.value.account_email = 'person@example.test'

    expect(settings.hasChanges.value).toBe(false)
    expect(settings.requiresCurrentPassword.value).toBe(false)
    await expect(settings.save()).resolves.toMatchObject({ no_changes: true })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

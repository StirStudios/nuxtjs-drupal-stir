import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EditLink from '../../../layers/editorial/app/components/Edit/Link.vue'

const editControlsStub = {
  template: '<div data-admin-ui-controls />',
}

describe('EditLink layout contract', () => {
  it('keeps normal slotted content as direct layout children', async () => {
    const wrapper = await mountSuspended(EditLink, {
      global: {
        stubs: {
          EditControls: editControlsStub,
          LazyEditControls: editControlsStub,
        },
      },
      props: {
        link: 'https://cms.example/paragraph/1/edit',
      },
      slots: {
        default:
          '<a class="layout-item">One</a><a class="layout-item">Two</a>',
      },
    })

    expect(wrapper.findAll('.layout-item')).toHaveLength(2)
    expect(wrapper.find('.admin-ui-edit-shell').exists()).toBe(false)
  })

  it('creates a positioning shell only when explicitly isolated', async () => {
    const wrapper = await mountSuspended(EditLink, {
      global: {
        stubs: {
          EditControls: editControlsStub,
          LazyEditControls: editControlsStub,
        },
      },
      props: {
        controlsPlacement: 'isolated',
        link: 'https://cms.example/paragraph/1/edit',
      },
      slots: {
        default: '<div class="editable-field">Editable text</div>',
      },
    })

    const shell = wrapper.get('.admin-ui-edit-shell')

    expect(shell.get('.editable-field').text()).toBe('Editable text')
  })
})

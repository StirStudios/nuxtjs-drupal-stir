import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import EditLink from '../../../layers/editorial/app/components/Edit/Link.vue'
import {
  layoutEditLinksKey,
  presentationEditTargetsKey,
} from '../../../layers/theme/app/utils/layoutEditLinks'

const editControlsStub = defineComponent({
  props: {
    actions: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const actionKeys = computed(() => props.actions
      .map(action => (action as { key?: string }).key)
      .filter(Boolean)
      .join(','))
    const actionParagraphIds = computed(() => props.actions
      .filter(action => (action as { paragraphId?: number }).paragraphId)
      .map(action => `${(action as { key?: string }).key}:${(action as { paragraphId?: number }).paragraphId}`)
      .join(','))

    return { actionKeys, actionParagraphIds }
  },
  template: '<div data-admin-ui-controls :data-action-keys="actionKeys" :data-action-paragraph-ids="actionParagraphIds" />',
})

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

  it('keeps the isolated shell stable before edit actions are available', async () => {
    const wrapper = await mountSuspended(EditLink, {
      global: {
        stubs: {
          EditControls: editControlsStub,
          LazyEditControls: editControlsStub,
        },
      },
      props: {
        controlsPlacement: 'isolated',
      },
      slots: {
        default: '<div class="editable-field">Editable text</div>',
      },
    })

    const shell = wrapper.get('.admin-ui-edit-shell')

    expect(shell.get('.editable-field').text()).toBe('Editable text')
    expect(shell.find('[data-admin-ui-controls]').exists()).toBe(false)
  })

  it('omits quick settings when Drupal does not advertise them', async () => {
    const wrapper = await mountSuspended(EditLink, {
      global: {
        provide: {
          [presentationEditTargetsKey as symbol]: computed(() => new Map()),
        },
        stubs: {
          EditControls: editControlsStub,
          LazyEditControls: editControlsStub,
        },
      },
      props: {
        id: 244,
        link: 'https://cms.example/paragraph/244/edit',
      },
    })

    expect(wrapper.get('[data-admin-ui-controls]').attributes('data-action-keys'))
      .toBe('full')
  })

  it('keeps media quick settings separate from parent Layout editing', async () => {
    const editLink = 'https://cms.example/paragraph/42/edit'
    const wrapper = await mountSuspended(EditLink, {
      global: {
        provide: {
          [layoutEditLinksKey as symbol]: computed(() => new Map([
            ['layout-parent', { editLink: 'https://cms.example/paragraph/9/edit' }],
          ])),
          [presentationEditTargetsKey as symbol]: computed(() => new Map([
            [editLink, { paragraphId: 42 }],
            ['https://cms.example/paragraph/9/edit', { paragraphId: 9 }],
          ])),
        },
        stubs: {
          EditControls: editControlsStub,
          LazyEditControls: editControlsStub,
        },
      },
      props: {
        id: 42,
        link: editLink,
        parentUuid: 'layout-parent',
      },
    })

    expect(wrapper.get('[data-admin-ui-controls]').attributes('data-action-keys'))
      .toBe('full,presentation,layout')
    expect(wrapper.get('[data-admin-ui-controls]').attributes('data-action-paragraph-ids'))
      .toBe('presentation:42,layout:9')
  })
})

import type { ThemeProps } from '@nuxt/ui/components/Theme.vue'

type AdminUiProps = NonNullable<ThemeProps['props']>

type AdminUiTheme = {
  navigationMenu: {
    root: string
    list: string
    item: string
    link: string
    linkLabel: string
    linkLeadingIcon: string
    linkTrailingIcon: string
    viewport: string
    content: string
    childList: string
    childItem: string
    childLink: string
    childLinkIcon: string
    childLinkLabel: string
  }
  button: {
    base: string
    leadingIcon: string
    trailingIcon: string
  }
  card: {
    header: string
    body: string
    footer: string
  }
  formField: {
    label: string
    description: string
  }
  fieldGroup: {
    base: string
  }
  tooltip: {
    content: string
    arrow: string
    text: string
  }
  popover: {
    content: string
    arrow: string
  }
  select: {
    base: string
    value: string
    placeholder: string
    content: string
  }
  selectMenu: {
    base: string
    value: string
    placeholder: string
    content: string
  }
  switch: {
    base: string
    thumb: string
  }
  modal: {
    overlay: string
    content: string
    title: string
  }
  skeleton: {
    base: string
  }
  editor: {
    root: string
    content?: string
    base?: string
  }
  editorToolbar: {
    root?: string
    base?: string
    group?: string
    separator: string
  }
  separator: {
    root?: string
    border: string
    container?: string
    icon?: string
    avatar?: string
    avatarSize?: string
    label?: string
  }
}

export type EditorialTaskLink = {
  label: string
  to: string
  icon: string | null
  tooltip: boolean
  class?: string
  active?: boolean
  onSelect?: (event: Event) => void
}

export function withUnpublishedTask(
  links: EditorialTaskLink[],
  published: unknown,
): EditorialTaskLink[] {
  if (published !== false) return links

  return links.map((link) =>
    link.label === 'View'
      ? {
          ...link,
          label: 'Unpublished',
          icon: 'i-lucide-eye-off',
          class: 'admin-ui-unpublished-link',
        }
      : link,
  )
}

export const adminUiTheme = {
  navigationMenu: {
    root: 'admin-ui admin-ui-scope admin-ui-nav-root app-admin-tabs-font sticky top-0 z-60 h-[3.5rem] w-full p-4',
    list: 'isolate',
    item: 'relative',
    link: 'app-admin-tabs-font admin-ui-nav-link before:bg-transparent text-sm font-medium dark:before:bg-transparent',
    linkLabel: 'sr-only md:not-sr-only md:block',
    linkLeadingIcon:
      'text-current group-hover:text-current group-data-[state=open]:text-current',
    linkTrailingIcon:
      'text-current group-hover:text-current group-data-[state=open]:text-current transition-transform duration-200',
    viewport:
      'app-admin-tabs-font relative overflow-hidden rounded-md admin-ui-nav-surface shadow-md',
    content: 'app-admin-tabs-font rounded-md admin-ui-nav-surface p-1',
    childList: 'space-y-0.5 ms-0 border-0',
    childItem: '',
    childLink: 'app-admin-tabs-font admin-ui-nav-child-link',
    childLinkIcon:
      'text-current group-hover:text-current group-aria-[current=page]:text-current',
    childLinkLabel: 'truncate',
  },
  button: {
    base: 'admin-ui-btn-base',
    leadingIcon: 'text-current',
    trailingIcon: 'text-current',
  },
  card: {
    header: 'admin-ui-card-header',
    body: 'admin-ui-card-body',
    footer: 'admin-ui-card-footer',
  },
  formField: {
    label: 'admin-ui-form-label',
    description: 'admin-ui-form-description',
  },
  fieldGroup: {
    base: 'admin-ui-field-group',
  },
  tooltip: {
    content: 'admin-ui admin-ui-scope admin-ui-tooltip-content',
    arrow: 'admin-ui-tooltip-arrow',
    text: 'admin-ui-tooltip-text',
  },
  popover: {
    content: 'admin-ui admin-ui-scope admin-ui-popover',
    arrow: 'admin-ui-tooltip-arrow',
  },
  select: {
    base: 'admin-ui-popover-control ring-default',
    value: 'admin-ui-control-value',
    placeholder: 'admin-ui-control-value',
    content: 'admin-ui admin-ui-scope admin-ui-popover',
  },
  selectMenu: {
    base: 'admin-ui-popover-control ring-default',
    value: 'admin-ui-control-value',
    placeholder: 'admin-ui-control-value',
    content: 'admin-ui admin-ui-scope admin-ui-popover',
  },
  switch: {
    base: 'admin-ui-switch-track',
    thumb: 'admin-ui-switch-thumb',
  },
  modal: {
    overlay: 'admin-ui-modal-overlay',
    content: 'admin-ui admin-ui-scope admin-ui-modal',
    title: 'admin-ui-modal-title',
  },
  skeleton: {
    base: 'admin-ui-skeleton',
  },
  editor: {
    root: 'admin-ui-editor-root',
  },
  editorToolbar: {
    separator: 'bg-[var(--admin-border)]',
  },
  separator: {
    border: 'bg-[var(--admin-border)]',
  },
} as const satisfies AdminUiTheme

export const adminUiProps = {
  button: {
    color: 'neutral',
    size: 'sm',
    variant: 'ghost',
  },
  card: {
    variant: 'outline',
  },
  radioGroup: {
    color: 'primary',
    size: 'sm',
  },
  select: {
    color: 'neutral',
    size: 'sm',
    variant: 'outline',
  },
  selectMenu: {
    color: 'neutral',
    size: 'sm',
    variant: 'outline',
  },
  switch: {
    color: 'primary',
    size: 'sm',
  },
} as const satisfies AdminUiProps

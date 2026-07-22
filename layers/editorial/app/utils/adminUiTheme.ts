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
  fieldGroup: {
    base: string
  }
  tooltip: {
    content: string
    arrow: string
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

  const editIndex = links.findIndex(link => link.label === 'Edit')
  const editLink = links[editIndex]

  if (editIndex < 0 || !editLink) return links

  const taskLinks = [...links]

  taskLinks.splice(editIndex, 0, {
    ...editLink,
    label: 'Unpublished',
    icon: 'i-lucide-eye-off',
    class: 'admin-ui-unpublished-link',
    active: false,
  })

  return taskLinks
}

export const adminUiTheme = {
  navigationMenu: {
    root: 'admin-ui admin-ui-scope admin-ui-nav-root app-admin-tabs-font sticky top-0 z-60 h-[3.5rem] w-full p-4',
    list: 'isolate',
    item: 'relative',
    link: 'app-admin-tabs-font admin-ui-nav-link before:bg-transparent text-sm font-medium dark:before:bg-transparent',
    linkLabel: 'sr-only md:not-sr-only md:block',
    linkLeadingIcon:
      'text-current group-hover:!text-current group-data-[state=open]:!text-current',
    linkTrailingIcon:
      'text-current group-hover:!text-current group-data-[state=open]:!text-current transition-transform duration-200',
    viewport:
      'app-admin-tabs-font relative overflow-hidden rounded-md admin-ui-nav-surface shadow-md',
    content: 'app-admin-tabs-font rounded-md admin-ui-nav-surface p-1',
    childList: 'space-y-0.5 !ms-0 !border-0',
    childItem: '',
    childLink: 'app-admin-tabs-font admin-ui-nav-child-link',
    childLinkIcon:
      'text-current group-hover:!text-current group-aria-[current=page]:!text-current',
    childLinkLabel: 'truncate',
  },
  button: {
    base: 'admin-ui-btn-base',
    leadingIcon: 'text-current',
    trailingIcon: 'text-current',
  },
  fieldGroup: {
    base: 'admin-ui-field-group',
  },
  tooltip: {
    content: 'admin-ui-scope admin-ui-tooltip-content',
    arrow: 'admin-ui-tooltip-arrow',
  },
  editor: {
    root: 'admin-ui-editor-root',
  },
  editorToolbar: {
    separator: '!bg-[var(--admin-border)]',
  },
  separator: {
    border: '!bg-[var(--admin-border)]',
  },
} as const satisfies AdminUiTheme

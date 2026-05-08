export const adminUiTheme = {
  navigationMenu: {
    slots: {
      root: 'admin-ui admin-ui-scope admin-ui-nav-root app-admin-tabs-font sticky top-0 z-60 h-[3.5rem] w-full p-4',
      list: 'isolate',
      item: 'relative',
      link: 'app-admin-tabs-font admin-ui-nav-link before:bg-transparent text-sm font-medium dark:before:bg-transparent',
      linkLabel: 'sr-only md:not-sr-only md:block',
      linkLeadingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current',
      linkTrailingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current transition-transform duration-200',
      viewport: 'app-admin-tabs-font relative overflow-hidden rounded-md admin-ui-nav-surface shadow-md',
      content: 'app-admin-tabs-font rounded-md admin-ui-nav-surface p-1',
      childList: 'space-y-0.5 !ms-0 !border-0',
      childItem: '',
      childLink: 'app-admin-tabs-font admin-ui-nav-child-link',
      childLinkIcon: 'text-current group-hover:!text-current group-aria-[current=page]:!text-current',
      childLinkLabel: 'truncate',
    },
  },
  button: {
    slots: {
      base: 'admin-ui-btn-base',
      leadingIcon: 'text-current',
      trailingIcon: 'text-current',
    },
    defaultVariants: {
      color: 'neutral',
      variant: 'soft',
    },
    compoundVariants: [
      {
        color: 'neutral',
        variant: 'soft',
        class: 'admin-ui-btn-neutral admin-ui-btn-soft',
      },
      {
        color: 'neutral',
        variant: 'outline',
        class: 'admin-ui-btn-neutral admin-ui-btn-outline',
      },
      {
        color: 'neutral',
        variant: 'ghost',
        class: 'admin-ui-btn-neutral admin-ui-btn-ghost',
      },
      {
        color: 'neutral',
        variant: 'solid',
        class: 'admin-ui-btn-neutral admin-ui-btn-solid',
      },
    ],
  },
  fieldGroup: {
    base: 'admin-ui-field-group',
  },
  tooltip: {
    slots: {
      content: 'admin-ui-tooltip-content',
      arrow: 'admin-ui-tooltip-arrow',
    },
  },
  editor: {
    slots: {
      root: 'admin-ui-editor-root',
    },
  },
  editorToolbar: {
    slots: {
      separator: '!bg-[var(--admin-border)]',
    },
  },
  separator: {
    base: '!bg-[var(--admin-border)]',
  },
} as const

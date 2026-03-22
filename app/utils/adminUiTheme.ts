export const adminUiTheme = {
  button: {
    base: 'admin-ui-btn-base',
    defaultVariants: {
      color: 'neutral',
      variant: 'soft',
    },
    variants: {
      color: {
        neutral: 'admin-ui-btn-neutral',
      },
      variant: {
        soft: 'admin-ui-btn-soft',
        outline: 'admin-ui-btn-outline',
      },
    },
  },
  fieldGroup: {
    base: 'admin-ui-field-group',
  },
  tooltip: {
    content: 'admin-ui-tooltip-content',
  },
  editor: {
    slots: {
      root: 'admin-ui-editor-root',
    },
  },
} as const

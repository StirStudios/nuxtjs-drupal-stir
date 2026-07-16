import withNuxt from './.nuxt/eslint.config.mjs'
import globals from 'globals'

export default withNuxt(
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        $nuxt: 'readonly',
      },
    },
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],
      'vue/no-v-html': 'off',
      'vue/this-in-template': 'off',
      'vue/html-self-closing': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-unused-vars': 'error',
      quotes: ['error', 'single'],
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/order-in-components': 'error',
      'vue/attributes-order': ['error', { alphabetical: true }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
      'no-debugger': 'error',
    },
  },
  {
    files: ['layers/*/app/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '#app',
              allowTypeImports: true,
              message: 'Use Nuxt auto-imports for runtime APIs in app code; keep type imports explicit.',
            },
          ],
          patterns: [
            {
              group: ['~/utils', '~/utils/**', '~/composables', '~/composables/**', '~/components', '~/components/**', '~/types', '~/types/**'],
              message: 'Use the explicit `#stir/*` surface; `~/*` is reserved for compatibility consumers.',
            },
            {
              group: ['**/theme/app/utils/**', '**/theme/app/composables/**', '**/theme/app/components/**', '**/theme/app/types/**'],
              message: 'Use the explicit `#stir/*` surface instead of importing theme internals by path.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['layers/theme/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '#app',
              allowTypeImports: true,
              message: 'Use Nuxt auto-imports for runtime APIs in app code; keep type imports explicit.',
            },
          ],
          patterns: [
            {
              group: ['~/utils', '~/utils/**', '~/composables', '~/composables/**', '~/components', '~/components/**', '~/types', '~/types/**'],
              message: 'Use the explicit `#stir/*` surface; `~/*` is reserved for compatibility consumers.',
            },
            {
              group: ['**/theme/app/utils/**', '**/theme/app/composables/**', '**/theme/app/components/**', '**/theme/app/types/**'],
              message: 'Use the explicit `#stir/*` surface instead of importing theme internals by path.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['layers/theme/app/components/global/node--default.vue'],
    rules: {
      'vue/prop-name-casing': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['layers/theme/app/layouts/clear.vue', 'layers/theme/app/layouts/default.vue'],
    rules: {
      'vue/no-multiple-template-root': 'off',
    },
  },
)

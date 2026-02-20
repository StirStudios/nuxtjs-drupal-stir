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
      'vue/no-unused-vars':
        process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      quotes: ['error', 'single'],
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/order-in-components': 'error',
      'vue/attributes-order': ['error', { alphabetical: true }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
  {
    files: ['app/components/global/node--default.vue'],
    rules: {
      'vue/prop-name-casing': 'off',
    },
  },
  {
    files: ['app/layouts/clear.vue', 'app/layouts/default.vue'],
    rules: {
      'vue/no-multiple-template-root': 'off',
    },
  },
)

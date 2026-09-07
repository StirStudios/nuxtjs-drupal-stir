import assert from 'node:assert/strict'
import { createSSRApp, defineComponent, h, withAsyncContext } from 'vue'
import { renderToString } from 'vue/server-renderer'

const Child = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})
const sibling = (ticks) => defineComponent({
  async setup() {
    let pending = Promise.resolve()
    for (let i = 0; i < ticks; i++) pending = pending.then(() => {})
    const [awaitable, restore] = withAsyncContext(() => pending)
    await awaitable
    restore()
    return () => h(Child, null, { default: () => h('span', 'test') })
  },
})
const warnings = []
const app = createSSRApp({ render: () => h('main', [h(sibling(0)), h(sibling(4))]) })
app.config.warnHandler = message => warnings.push(message)
assert.equal(await renderToString(app), '<main><div><span>test</span></div><div><span>test</span></div></main>')
assert.deepEqual(warnings, [])
console.log('Vue async SSR context regression passed.')

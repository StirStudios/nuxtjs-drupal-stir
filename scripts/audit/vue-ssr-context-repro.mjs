import assert from 'node:assert/strict'
import { createRenderer, createSSRApp, defineComponent, h, ref, Suspense, withAsyncContext } from 'vue'
import { Window } from 'happy-dom'
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

// Exercise queued client updates with the installed runtime and a DOM host.
const { document } = new Window()
const { createApp } = createRenderer({
  insert: (child, parent, anchor = null) => parent.insertBefore(child, anchor),
  remove: child => child.remove(),
  createElement: tag => document.createElement(tag),
  createText: text => document.createTextNode(text),
  createComment: text => document.createComment(text),
  setText: (node, text) => { node.nodeValue = text },
  setElementText: (node, text) => { node.textContent = text },
  parentNode: node => node.parentNode,
  nextSibling: node => node.nextSibling,
  patchProp: (node, key, _previous, value) => node.setAttribute(key, value),
})
let release
const ready = new Promise(resolve => { release = resolve })
const value = ref(0)
ready.then(() => {}).then(() => { value.value++ })
const AsyncSibling = defineComponent({
  async setup() {
    const [pending, restore] = withAsyncContext(() => ready)
    await pending
    restore()
    return () => h('i', 'ready')
  },
})
const clientApp = createApp({
  render: () => h('main', [
    h(Child, null, { default: () => String(value.value) }),
    h(Suspense, null, { default: () => h(AsyncSibling) }),
  ]),
})
clientApp.config.warnHandler = message => warnings.push(message)
const root = document.createElement('div')
clientApp.mount(root)
await new Promise(resolve => setTimeout(resolve))
release()
await new Promise(resolve => setTimeout(resolve))
assert.equal(root.innerHTML, '<main><div>1</div><i>ready</i></main>')
assert.deepEqual(warnings, [])
clientApp.unmount()
console.log('Vue queued client context regression passed.')

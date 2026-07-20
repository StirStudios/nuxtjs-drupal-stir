import { Node, mergeAttributes } from '@tiptap/core'

type DrupalMediaAttributes = Record<string, string>

function readAttributes(element: Element): DrupalMediaAttributes {
  return Object.fromEntries(
    Array.from(element.attributes, ({ name, value }) => [name, value]),
  )
}

export const DrupalMedia = Node.create({
  name: 'drupalMedia',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'drupal-media' }]
  },

  addAttributes() {
    return {
      preservedAttributes: {
        default: {},
        parseHTML: readAttributes,
        rendered: false,
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'drupal-media',
      mergeAttributes(node.attrs.preservedAttributes, HTMLAttributes),
      '\u00a0',
    ]
  },
})

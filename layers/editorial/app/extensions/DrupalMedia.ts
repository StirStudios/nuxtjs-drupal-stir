import { Node, mergeAttributes } from '@tiptap/core'

type DrupalMediaAttributes = Record<string, string>

function mediaPlaceholderLabel(attributes: DrupalMediaAttributes): string {
  const mediaType = attributes['data-media-type']?.trim()

  if (mediaType) {
    return `Embedded ${mediaType.replaceAll('_', ' ')}`
  }

  return 'Embedded media'
}

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

  addNodeView() {
    return ({ node }) => {
      const attributes = node.attrs.preservedAttributes as DrupalMediaAttributes
      const dom = document.createElement('div')
      const label = document.createElement('span')
      const description = document.createElement('span')

      dom.className = 'admin-editor-media-placeholder'
      dom.contentEditable = 'false'
      dom.dataset.drupalMediaPlaceholder = 'true'
      dom.setAttribute('role', 'note')

      label.className = 'admin-editor-media-placeholder-label'
      label.textContent = mediaPlaceholderLabel(attributes)

      description.className = 'admin-editor-media-placeholder-description'
      description.textContent = 'Preserved from Drupal and restored after saving.'

      dom.append(label, description)

      return { dom }
    }
  },
})

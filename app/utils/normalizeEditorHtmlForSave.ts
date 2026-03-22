function stripTrailingEmptyParagraphs(value: string): string {
  return value
    .replace(/(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>|\u00a0)*<\/p>\s*)+$/gi, '')
    .trim()
}

function unwrapSimpleListItemParagraphs(value: string): string {
  if (import.meta.client === false) return value

  const template = document.createElement('template')

  template.innerHTML = value

  const listItems = template.content.querySelectorAll('li')

  for (const listItem of listItems) {
    const elementChildren = Array.from(listItem.children)

    if (elementChildren.length !== 1) continue

    const onlyChild = elementChildren[0]

    if (onlyChild.tagName !== 'P') continue
    if (onlyChild.attributes.length > 0) continue

    while (onlyChild.firstChild) {
      listItem.insertBefore(onlyChild.firstChild, onlyChild)
    }

    onlyChild.remove()
  }

  return template.innerHTML
}

export function normalizeEditorHtmlForSave(value: string): string {
  return unwrapSimpleListItemParagraphs(stripTrailingEmptyParagraphs(value))
}

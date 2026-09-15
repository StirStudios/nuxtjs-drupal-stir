// @nuxtjs/robots renders its meta tag only during server rendering or
// prerendering. Client-rendered documents (`ssr: false`) receive the same
// resolved rule here; server-rendered documents already carry it.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const rule = (event.context.robots as { rule?: string } | undefined)?.rule

    if (!rule || html.head.some(chunk => chunk.includes('name="robots"'))) return

    html.head.push(`<meta name="robots" content="${rule}">`)
  })
})

import type { RouterOptions } from '@nuxt/schema'

export default <RouterOptions>{
  scrollBehavior(to, from, savedPosition) {
    const offset = 80

    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else if (to.hash) {
          const el = document.querySelector(to.hash)

          if (el) {
            resolve({
              top: el.getBoundingClientRect().top + window.scrollY - offset,
              behavior: 'smooth',
            })
          } else {
            resolve({ top: 0 })
          }
        } else if (to.path === from.path) {
          resolve(false)
        } else {
          resolve({ top: 0 })
        }
      }, 100)
    })
  },
}

import type { RouterOptions } from '@nuxt/schema'

export default <RouterOptions>{
  scrollBehavior(to, _from, savedPosition) {
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
        } else {
          resolve({ top: 0 })
        }
      }, 100)
    })
  },
}

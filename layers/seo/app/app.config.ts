export default defineAppConfig({
  cmsGlobalSeo: {
    enabled: true,
    ignoredPathPrefixes: ['/account', '/auth'],
    ignoredPaths: [],
    drupalRouteNames: ['slug'],
    iconImage: {
      enabled: true,
    },
    socialImage: {
      enabled: true,
      format: 'jpeg',
      height: 630,
      quality: 90,
      width: 1200,
    },
  },
})

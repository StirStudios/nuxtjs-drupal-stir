export default defineAppConfig({
  cmsGlobalSeo: {
    enabled: false,
    ignoredPathPrefixes: ['/account', '/auth'],
    ignoredPaths: [],
    drupalRouteNames: ['slug'],
    socialImage: {
      enabled: true,
      format: 'jpeg',
      height: 630,
      quality: 90,
      width: 1200,
    },
  },
})

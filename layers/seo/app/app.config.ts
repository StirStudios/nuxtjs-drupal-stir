export default defineAppConfig({
  cmsGlobalSeo: {
    enabled: false,
    ignoredPathPrefixes: ['/account', '/auth'],
    ignoredPaths: [],
    drupalRouteNames: ['slug'],
  },
})

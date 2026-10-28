import { setGlobalDispatcher } from 'undici'
import { createOutboundDispatcher } from '../utils/outboundRetry'

// Every server-side GET (the CE proxy, $fetch routes, image fetches) retries
// once after a connection error, from one place.
export default defineNitroPlugin(() => {
  setGlobalDispatcher(createOutboundDispatcher())
})

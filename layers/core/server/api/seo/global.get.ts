import { defineEventHandler } from 'h3'
import { fetchGlobalSeo } from '../../utils/globalSeoApi'

export default defineEventHandler(async event => await fetchGlobalSeo(event))

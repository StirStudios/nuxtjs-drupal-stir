import { defineEventHandler } from 'h3'
import { fetchSitemap } from '../utils/sitemapApi'

export default defineEventHandler(async event => await fetchSitemap(event))

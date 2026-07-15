import { defineEventHandler } from 'h3'
import { fetchAuthUiConfig } from '../../utils/authUiConfigApi'

export default defineEventHandler(async event => await fetchAuthUiConfig(event))

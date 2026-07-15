import { defineEventHandler } from 'h3'
import { fetchRegisterPolicy } from '../../utils/registerPolicyApi'

export default defineEventHandler(async event => await fetchRegisterPolicy(event))

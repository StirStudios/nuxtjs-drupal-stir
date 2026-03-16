import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: unknown }>(event)
  const config = useRuntimeConfig()
  const password =
    typeof body?.password === 'string' ? body.password : undefined
  const expectedPassword = config.public.protectedPassword

  if (!password || !expectedPassword || password !== expectedPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }

  await setUserSession(event, {
    authenticated: true,
    user: { role: 'reader' },
  })

  return { success: true }
})

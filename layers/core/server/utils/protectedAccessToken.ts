import { createHmac, timingSafeEqual } from 'node:crypto'

type ProtectedAccessPayload = {
  v: 1
  exp: number
}

const ALGO = 'sha256'
const VERSION = 1

const encode = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

const decode = (value: string): string | null => {
  try {
    return Buffer.from(value, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

const sign = (data: string, secret: string): string =>
  createHmac(ALGO, secret).update(data).digest('base64url')

const equalsSafe = (a: string, b: string): boolean => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) return false

  return timingSafeEqual(left, right)
}

export const createProtectedAccessToken = (
  secret: string,
  maxAgeSeconds: number,
): string => {
  const payload: ProtectedAccessPayload = {
    v: VERSION,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const encodedPayload = encode(JSON.stringify(payload))
  const signature = sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export const verifyProtectedAccessToken = (
  token: string | undefined,
  secret: string,
): boolean => {
  if (!token) return false

  const [encodedPayload, receivedSignature] = token.split('.')

  if (!encodedPayload || !receivedSignature) return false

  const expectedSignature = sign(encodedPayload, secret)

  if (!equalsSafe(receivedSignature, expectedSignature)) return false

  const decodedPayload = decode(encodedPayload)

  if (!decodedPayload) return false

  try {
    const payload = JSON.parse(decodedPayload) as Partial<ProtectedAccessPayload>

    if (payload.v !== VERSION) return false
    if (typeof payload.exp !== 'number') return false

    return payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

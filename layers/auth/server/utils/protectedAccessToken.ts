type ProtectedAccessPayload = {
  v: 1
  exp: number
}

const ALGORITHM = 'SHA-256'
const VERSION = 1

const encodeBytesBase64Url = (bytes: Uint8Array): string => {
  let binary = ''

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const encodeBase64Url = (value: string): string =>
  encodeBytesBase64Url(new TextEncoder().encode(value))

const decodeBase64Url = (value: string): string | null => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)

  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

const sign = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: ALGORITHM },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    { name: 'HMAC' },
    key,
    new TextEncoder().encode(data),
  )

  return encodeBytesBase64Url(new Uint8Array(signature))
}

export const layerAuthConstantTimeEquals = (
  first: string,
  second: string,
): boolean => {
  const maxLength = Math.max(first.length, second.length)
  let mismatch = first.length ^ second.length

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (first.charCodeAt(index) || 0) ^ (second.charCodeAt(index) || 0)
  }

  return mismatch === 0
}

export const layerAuthCreateProtectedAccessToken = async (
  secret: string,
  maxAgeSeconds: number,
): Promise<string> => {
  const payload: ProtectedAccessPayload = {
    v: VERSION,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))

  return `${encodedPayload}.${await sign(encodedPayload, secret)}`
}

export const layerAuthVerifyProtectedAccessToken = async (
  token: string | undefined,
  secret: string,
): Promise<boolean> => {
  if (!token) return false

  const [encodedPayload, receivedSignature] = token.split('.')

  if (!encodedPayload || !receivedSignature) return false

  const expectedSignature = await sign(encodedPayload, secret)

  if (!layerAuthConstantTimeEquals(receivedSignature, expectedSignature)) return false

  const decodedPayload = decodeBase64Url(encodedPayload)

  if (!decodedPayload) return false

  try {
    const payload = JSON.parse(decodedPayload) as Partial<ProtectedAccessPayload>

    return payload.v === VERSION
      && typeof payload.exp === 'number'
      && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

type ProtectedAccessPayload = {
  v: 1
  exp: number
}

const ALGO = 'SHA-256'
const VERSION = 1

const encodeBytesBase64Url = (bytes: Uint8Array): string => {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

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

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }

    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

const createSignatureBytes = async (
  data: string,
  secret: string,
): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: ALGO },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    { name: 'HMAC' },
    key,
    new TextEncoder().encode(data),
  )

  return new Uint8Array(signature)
}

const sign = async (data: string, secret: string): Promise<string> =>
  encodeBytesBase64Url(await createSignatureBytes(data, secret))

const equalsSafe = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false

  let mismatch = 0

  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
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
  const signature = await sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export const layerAuthVerifyProtectedAccessToken = async (
  token: string | undefined,
  secret: string,
): Promise<boolean> => {
  if (!token) return false

  const [encodedPayload, receivedSignature] = token.split('.')

  if (!encodedPayload || !receivedSignature) return false

  const expectedSignature = await sign(encodedPayload, secret)

  if (!equalsSafe(receivedSignature, expectedSignature)) return false

  const decodedPayload = decodeBase64Url(encodedPayload)

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

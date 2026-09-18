/**
 * Cloudflare's published edge ranges, from https://www.cloudflare.com/ips/
 * (checked 2026-09-18; they change rarely). Update from that page when they do.
 */
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
]

const ipv4ToBigInt = (address: string): bigint | undefined => {
  const parts = address.split('.')

  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return undefined

  return parts.reduce((value, part) => (value << 8n) + BigInt(part), 0n)
}

const ipv6ToBigInt = (address: string): bigint | undefined => {
  const halves = address.toLowerCase().split('::')

  if (halves.length > 2) return undefined

  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length

  if ((halves.length === 1 && missing !== 0) || missing < 0) return undefined

  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]

  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return undefined

  return groups.reduce((value, group) => (value << 16n) + BigInt(`0x${group}`), 0n)
}

const toBigInt = (address: string): { value: bigint, bits: number } | undefined => {
  const v4 = ipv4ToBigInt(address)

  if (v4 !== undefined) return { value: v4, bits: 32 }

  const v6 = ipv6ToBigInt(address)

  return v6 === undefined ? undefined : { value: v6, bits: 128 }
}

const PARSED_RANGES = CLOUDFLARE_RANGES.map((range) => {
  const [network, prefix] = range.split('/') as [string, string]
  const parsed = toBigInt(network)!

  return { ...parsed, prefix: Number(prefix) }
})

/** Whether an address belongs to Cloudflare's edge network. */
export const isCloudflareAddress = (address: string): boolean => {
  const parsed = toBigInt(address)

  if (!parsed) return false

  return PARSED_RANGES.some((range) => {
    if (range.bits !== parsed.bits) return false

    const shift = BigInt(range.bits - range.prefix)

    return (parsed.value >> shift) === (range.value >> shift)
  })
}

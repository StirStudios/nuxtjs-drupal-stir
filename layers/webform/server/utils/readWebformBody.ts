import { createError, getRequestWebStream, readRawBody, setHeader, type H3Event } from 'h3'
import { assertWebformRawBodySize, type WebformSubmissionLimits } from './webformLimits'

/** Bound the wire body before JSON or multipart parsing, including chunked uploads. */
export async function readWebformBody(
  event: H3Event,
  limits: WebformSubmissionLimits,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  let bytes = 0
  const append = (chunk: Uint8Array | string) => {
    const buffer = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk

    bytes += buffer.byteLength
    assertWebformRawBodySize(bytes, limits)
    chunks.push(buffer)
  }
  const request = event.node.req

  if (request.readableEnded) {
    const cached = await readRawBody(event, false)

    if (cached) append(cached)
  } else if (event.web?.request?.body || event._requestBody !== undefined || !request.socket) {
    const body = event.web?.request?.body
      ?? (event._requestBody !== undefined ? new Response(event._requestBody).body : getRequestWebStream(event))
    const reader = body?.getReader()

    if (!reader) return new Uint8Array(0)

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break
        append(value)
      }
    } catch (error) {
      await reader.cancel().catch(() => {})
      throw error
    } finally {
      reader.releaseLock()
    }
  } else {
    if (request.destroyed) throw createError({ statusCode: 400, statusMessage: 'Incomplete form submission' })

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        request.off('data', onData)
        request.off('end', onEnd)
        request.off('error', onError)
        request.off('aborted', onAborted)
      }
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      const onAborted = () => onError(createError({ statusCode: 400, statusMessage: 'Incomplete form submission' }))
      const onEnd = () => {
        cleanup()
        resolve()
      }
      const onData = (chunk: Uint8Array) => {
        try {
          append(chunk)
        } catch (error) {
          cleanup()
          request.pause()
          // Send the 413 before closing the unread upload's connection.
          if (request.httpVersionMajor !== 2) setHeader(event, 'Connection', 'close')
          event.node.res.once('finish', () => request.destroy())
          reject(error)
        }
      }

      request.on('data', onData)
      request.once('end', onEnd)
      request.once('error', onError)
      request.once('aborted', onAborted)
    })
  }

  const result = new Uint8Array(bytes)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

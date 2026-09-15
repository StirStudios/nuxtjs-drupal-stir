import { defineEventHandler, setResponseHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  setResponseStatus(event, 404)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return 'Not Found'
})

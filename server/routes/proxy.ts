import axios from "axios"
import { sendStream } from "h3"
import { is } from "superstruct"
import { assertReturn } from "~/src/utils/inlines"

import { ValidProxiedHosts } from "~/src/proxy"

export default defineEventHandler(async (event) => {
  let statusCode = 500

  try {
    const urlOnQuery = getQuery(event).url
    const method = getMethod(event)
    const body = method === 'POST' ? await readRawBody(event, false) : undefined

    if (typeof urlOnQuery !== 'string') {
      statusCode = 400
      throw new Error('Invalid URL.')
    }

    const urlToProxy = new URL(assertReturn(
      urlOnQuery,
      'Invalid URL.',
      () => statusCode = 400
    ))

    if (!is(urlToProxy.hostname, ValidProxiedHosts)) {
      statusCode = 400
      throw new Error(`Cannot proxy from host ${urlToProxy.hostname}.`)
    }

    const headers: { [key: string]: string } = {}

    const headersOnQuery = urlToProxy.searchParams.getAll('headers[]')

    if (typeof headersOnQuery === 'object' && typeof headersOnQuery?.length !== 'undefined') {
      headersOnQuery.map((header: string) => {
        header = decodeURIComponent(header)
        headers[header.split('|')[0]] = header.split('|').slice(1).join("|")
      })
    }

    urlToProxy.searchParams.delete('headers[]')

    const [first, second] = urlToProxy.href.split('?')
    const combined = second ? `${decodeURIComponent(first)}?${second}` : decodeURIComponent(first)

    const stream = method === 'GET'
      ? await axios(combined, { responseType: 'stream', headers })
      : await axios.post(combined, new Uint8Array(body!), { responseType: 'stream', headers })

    if (stream.headers['content-type']) {
      setHeaders(event, {
        'Content-Type': stream.headers['content-type'],
      })
    }
    
    return sendStream(event, stream.data)
  } catch (error) {
    throw createError({
      statusCode: statusCode,
      // @ts-expect-error
      statusMessage: error.message
    })
  }
})
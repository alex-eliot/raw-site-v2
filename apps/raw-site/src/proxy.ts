import { setTransport } from "@raw-downloader/downloader/transport"

let proxyUrl = ''
let cookieString = ''

function buildProxiedUrl(url: string, headers: Record<string, string> = {}) {
  const finalUrl = new URL(url)

  Object.entries(headers).forEach(([key, value]) => {
    finalUrl.searchParams.append('headers[]', `${key}|${value}`)
  })

  if (cookieString)
    finalUrl.searchParams.append('headers[]', `cookie|${cookieString}`)

  return `${proxyUrl}/proxy?url=${encodeURIComponent(finalUrl.href)}`
}

setTransport({
  request(url, options = {}) {
    return fetch(buildProxiedUrl(url, options.headers), {
      method: options.method,
      body: options.body
    })
  },
  async image(url, headers = {}) {
    const response = await fetch(buildProxiedUrl(url, headers))

    if (!response.ok)
      throw new Error(`Failed to fetch image (HTTP ${response.status}).`)

    return response.blob()
  }
})

export function setProxyUrl(url: string) {
  if (url.at(-1) === '/') url = url.slice(0, -1)
  proxyUrl = url
}

export function setCookieString(cookie: string) {
  cookieString = cookie
}

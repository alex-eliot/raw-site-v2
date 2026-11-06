export type RequestHeaders = Record<string, string>

export interface TransportRequestOptions {
  method?: string
  headers?: RequestHeaders
  body?: BodyInit | null
}

export interface Transport {
  request(url: string, options?: TransportRequestOptions): Promise<Response>
  image(url: string, headers?: RequestHeaders): Promise<Blob>
}

const directTransport: Transport = {
  request(url, options = {}) {
    return fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      credentials: 'include'
    })
  },
  async image(url, headers = {}) {
    const response = await fetch(url, { headers, credentials: 'include' })

    if (!response.ok)
      throw new Error(`Failed to fetch image (HTTP ${response.status}).`)

    return response.blob()
  }
}

let currentTransport: Transport = directTransport

export function setTransport(transport: Transport) {
  currentTransport = transport
}

export function getTransport() {
  return currentTransport
}

export function getResource(url: string, headers: RequestHeaders = {}) {
  return currentTransport.request(url, { headers })
}

export function postResource(url: string, headers: RequestHeaders, body: BodyInit | null | undefined) {
  return currentTransport.request(url, { method: 'POST', headers, body })
}

export async function loadImage(url: string, headers: RequestHeaders = {}): Promise<HTMLImageElement> {
  const blob = await currentTransport.image(url, headers)
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

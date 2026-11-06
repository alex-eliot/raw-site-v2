import JSZip from "jszip";
import type { ResourceHandler } from "../resources.type";
import { assertReturn } from "../utils/inlines";
import { getFromProxy, getProxiedUrl } from "../proxy";
import type { Infer } from "superstruct";
import { array, assert, is, number, string, type, validate } from "superstruct";

export const InfoSchema = type({
  result: array(type({
    id: string(),
    page_count: string()
  }))
})

export const ContentsSchema = type({
  result: array(type({
    width: number(),
    height: number(),
    imageUrl: string(),
    scramble: string(),
    sort: number()
  })),
  totalPages: number()
})

export default class YanMangaHandler implements ResourceHandler {
  url: URL;
  id: string
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    throw new Error('This handler not supported right now, it will be updated in the future.')

    this.url = new URL(url)
    this.id = assertReturn(
      this.url.pathname.split('/').at(-1),
      'Could not find id in URL.'
    )

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & descrambling images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const htmlResp = await getFromProxy(this.url.href)
    const htmlText = await htmlResp.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlText, 'text/html')

    const script = doc.querySelector('head script[src]')

    const dataset = doc.getElementById('comici-viewer')

    const apiKey = assertReturn(
      script?.getAttribute('src')?.match(/apikey=(.*)/)?.at(1),
      'Could not find API key in script.'
    )

    const token = assertReturn(
      dataset?.getAttribute('data-member-jwt') ?? undefined,
      'Could not find JWT token in the document file.'
    )

    const viewerId = assertReturn(
      dataset?.getAttribute('comici-viewer-id') ?? undefined,
      'Could not find the viewer id in the document file.'
    )

    const infoUrl = new URL('https://api2-yanmaga.comici.jp/book/episodeInfo')
    infoUrl.searchParams.set('comici-viewer-id', viewerId)

    const infoResp = await getFromProxy(infoUrl.href, {
      referer: 'https://yanmaga.jp'
    })
    const infoJson = await infoResp.json()

    assert(infoJson, InfoSchema)

    const contentsUrl = new URL('https://api2-yanmaga.comici.jp/book/contentsInfo')
    contentsUrl.searchParams.set('user-id', token)
    contentsUrl.searchParams.set('comici-viewer-id', viewerId)
    contentsUrl.searchParams.set('page-from', '0')
    contentsUrl.searchParams.set('page-to', infoJson.result.find(r => r.id === viewerId)!.page_count)

    const contentsResp = await getFromProxy(contentsUrl.href, {
      referer: 'https://yanmaga.jp'
    })
    const contentsJson = await contentsResp.json()

    assert(contentsJson, ContentsSchema)

    const totalPages = contentsJson.totalPages
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: Infer<typeof ContentsSchema>["result"][0], index: number) => {
      const img = new Image(page.width, page.height)
      img.crossOrigin = 'Anonymous'
      img.src = getProxiedUrl(page.imageUrl, {
        referer: 'https://yanmaga.jp'
      })
      await img.decode()

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = assertReturn(
        canvas.getContext('2d') ?? undefined,
        'Could not get canvas 2d context.'
      )

      const scrambleArray = page.scramble.replace('[', '').replace(']', '').split(', ')

      for (let dest in scrambleArray) {
        const src = scrambleArray[dest]

        const posSrc = [Math.floor(parseInt(src) / 4), parseInt(src) % 4]
        const posDest = [Math.floor(parseInt(dest) / 4), parseInt(dest) % 4]

        const chunkWidth = Math.floor(page.width / 4)
        const chunkHeight = Math.floor(page.height / 4)

        const source = [
          posSrc[0] * chunkWidth,
          posSrc[1] * chunkHeight,
        ]

        const destination = [
          posDest[0] * chunkWidth,
          posDest[1] * chunkHeight
        ]

        ctx.drawImage(img, source[0], source[1], chunkWidth, chunkHeight, destination[0], destination[1], chunkWidth, chunkHeight)
      }

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, canvasToBuffer(canvas))

      canvas.width = 1
      canvas.height = 1
      ctx.clearRect(0, 0, 1, 1)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(contentsJson.result.map((page, index) => process(page, index)))

    return this.zipFile
  }
}

import JSZip from "jszip";
import type { ResourceHandler } from "../resources.type";
import { getFromProxy, getProxiedUrl } from "../proxy";
import { array, assert, number, optional, string, type } from "superstruct";
import { assertReturn } from "../utils/inlines";

export const EpisodeInfoSchema = type({
  code: number(),
  message: string(),
  result: array(type({
    id: string(),
    page_count: string()
  })),
})

export const ContentsInfoSchema = type({
  code: number(),
  message: string(),
  result: array(type({
    expiresOn: number(),
    height: number(),
    width: number(),
    imageUrl: string(),
    scramble: string(),
    sort: number()
  })),
  totalPages: number()
})

export default class ComiciHandler implements ResourceHandler {
  url: URL;
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & descrambling images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const base = this.url.hostname

    const viewerId = await (async () => {
      const resp = await getFromProxy(this.url.href)
      const html = await resp.text()
  
      const parser = new DOMParser()
      const parsed = parser.parseFromString(html, 'text/html')
  
      return assertReturn(
        parsed.querySelector('#comici-viewer')?.getAttribute('comici-viewer-id'),
        'Could not locate viewer ID from document response.'
      )
    })()

    const totalPages = await (async () => {
      const resp = await getFromProxy(`https://${base}/book/episodeInfo?comici-viewer-id=${viewerId}&isPreview=false`, {
        referer: this.url.href
      })
      const body = await resp.json()

      assert(body, EpisodeInfoSchema)

      return Number(assertReturn(
        body.result.find(r => r.id === viewerId)?.page_count,
        'Could not find an episode with the same id as the current one.'
      ))
    })()

    let pagesComplete = 0

    const pages = await (async () => {
      const resp = await getFromProxy(`https://${base}/book/contentsInfo?user-id=0&comici-viewer-id=${viewerId}&page-from=0&page-to=${totalPages}`, {
        referer: this.url.href
      })
      const body = await resp.json()

      assert(body, ContentsInfoSchema)

      body.result.sort((a, b) => a.sort - b.sort)

      return body.result
    })()

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof pages[number], index: number) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = getProxiedUrl(page.imageUrl, {
        referer: this.url.href
      })
      await img.decode()

      const coords = this.getCoordsFromScramble(page.scramble, [page.width, page.height])

      const canvas = document.createElement('canvas')
      canvas.width = page.width
      canvas.height = page.height
      const ctx = assertReturn(
        canvas.getContext('2d') ?? undefined,
        `Could not get canvas context for page ${index + 1}`
      )

      coords.forEach(coord => {
        ctx.drawImage(img, coord.srcX, coord.srcY, coord.width, coord.height, coord.destX, coord.destY, coord.width, coord.height);
      });

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, canvasToBuffer(canvas))

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(pages.map((page, index) => process(page, index)))

    return this.zipFile
  }

  getCoordsFromScramble(scramble: string, size: [number, number]) {
    const coords: {
      srcX: number
      srcY: number
      destX: number
      destY:number
      width: number
      height: number
    }[] = [];

    function createTable(chunksX: number, chunksY: number) {
      const table: [number, number][] = []

      for (let i = 0; i < chunksX; i++) {
        for (let j = 0; j < chunksY; j++) {
          table.push([i, j])
        }
      }

      return table
    }

    function processScrambleTable(model: [number, number][], scramble: string) {
      const finalTable: [number, number][] = []
      const stringifiedTable = scramble.replace(/\s+/g, "").slice(1).slice(0, -1).split(",").map(i => Number(i))

      for (let i = 0; i < model.length; i++)
        finalTable.push(model[stringifiedTable[i]])

      return finalTable
    }

    let srcX: number, srcY: number, destX: number, destY: number, chunk_width: number, chunk_height: number;

    processScrambleTable(createTable(4, 4), scramble).forEach((model, i) => {
      srcX = model[0]
      srcY = model[1]
      destX = Math.floor(i / 4);
      destY = i % 4;
  
      chunk_width = Math.floor(size[0] / 4);
      chunk_height = Math.floor(size[1] / 4);
  
      coords.push({
        srcX: srcX * chunk_width,
        srcY: srcY * chunk_height,
        destX: destX * chunk_width,
        destY: destY * chunk_height,
        width: chunk_width,
        height: chunk_height
      });
    })

    return coords;
  }
}

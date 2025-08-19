import JSZip from "jszip";
import { ResourceHandler } from "../resources.type";
import { getFromProxy, getProxiedUrl } from "../proxy";
import { array, assert, optional, string, type, enums, defaulted } from "superstruct";
import { assertReturn } from "../utils/inlines";

type DescramblingConstants = {
  DIVIDE_NUM: number
  MULTIPLE: number
  width: number
  height: number
  cell_width: number
  cell_height: number
}

export const ChapterDataSchema = type({
  readableProduct: type({
    pageStructure: type({
      choJuGiga: defaulted(optional(enums(["baku", "usagi"])), "usagi"),
      pages: array(type({
        type: string(),
        src: optional(string())
      }))
    })
  })
})

export default class GigaViewHandler implements ResourceHandler {
  url: URL;
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const body = await getEpisodeBody(this.url)

    const totalPages = body.readableProduct.pageStructure.pages.filter(page => page.type === 'main').length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof body.readableProduct.pageStructure.pages[0], index: number) => {
      const buffer = await (body.readableProduct.pageStructure.choJuGiga === "baku"
        ? this.getDescrambledImage(page.src!)
        : this.getImageWithoutDrm(page.src!))

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(body.readableProduct.pageStructure.pages.filter(page => page.type === 'main').map((page, index) => process(page, index)))

    return this.zipFile
  }

  protected async getImageWithoutDrm(src: string) {
    return getFromProxy(src).then(r => r.arrayBuffer())
  }

  protected async getDescrambledImage(src: string) {
    const img = await this.getImageFromSrc(getProxiedUrl(src))
    const constants = this.getDescramblingConstants(img)
    return this.descramble(img, constants)
  }

  protected async getImageFromSrc(src: string) {
    return new Promise<HTMLImageElement>((rs, rj) => {
      const img = new Image()
      img.onload = () => rs(img)
      img.onerror = (err) => rj(err)
      img.src = src
    })
  }

  protected getDescramblingConstants(img: HTMLImageElement): DescramblingConstants {
    const DIVIDE_NUM = 4
    const MULTIPLE = 8
    const width = img.width
    const height = img.height
    const cell_width = Math.floor(width / (DIVIDE_NUM * MULTIPLE)) * MULTIPLE
    const cell_height = Math.floor(height / (DIVIDE_NUM * MULTIPLE)) * MULTIPLE

    return {
      DIVIDE_NUM,
      MULTIPLE,
      width,
      height,
      cell_width,
      cell_height,
    }
  }

  protected async descramble(img: HTMLImageElement, constants: DescramblingConstants) {
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = assertReturn(canvas.getContext("2d") ?? undefined, "Could not get canvas 2d context")

    ctx.drawImage(img, 0, 0, constants.width, constants.height, 0, 0, constants.width, constants.height)

    for (let e = 0; e < constants.DIVIDE_NUM * constants.DIVIDE_NUM; e++) {
      const t = Math.floor(e / constants.DIVIDE_NUM) * constants.cell_height
        , i = e % constants.DIVIDE_NUM * constants.cell_width
        , r = Math.floor(e / constants.DIVIDE_NUM)
        , n = e % constants.DIVIDE_NUM * constants.DIVIDE_NUM + r
        , s = n % constants.DIVIDE_NUM * constants.cell_width
        , o = Math.floor(n / constants.DIVIDE_NUM) * constants.cell_height;
      ctx.drawImage(img, i, t, constants.cell_width, constants.cell_height, s, o, constants.cell_width, constants.cell_height)
    }

    return canvasToBuffer(canvas)
  }
}

async function getEpisodeBody(url: URL) {
  const resp = await getFromProxy(`${url.href}.json`, {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 9; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4026.0 Mobile Safari/537.36'
  })

  if (resp.status !== 200) {
    const resp2 = await getFromProxy(url.href, {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 9; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4026.0 Mobile Safari/537.36'
    })
    const htmlString = await resp2.text()
    const html = new DOMParser().parseFromString(htmlString, 'text/html')
    const script = html.querySelector<HTMLScriptElement>('#episode-json')
    const body = JSON.parse(script?.dataset.value ?? "")
    assert(body, ChapterDataSchema)
    return body
  }

  const body = await resp.json()
  assert(body, ChapterDataSchema)
  return body
}

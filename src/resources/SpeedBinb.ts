import JSZip from "jszip";
import { ResourceHandler } from "../resources.type";
import { getFromProxy, getProxiedUrl } from "../proxy";
import { array, assert, number, object, string, type } from "superstruct";
import { assertReturn } from "../utils/inlines";

export const PageSchema = object({
  'ptimg-version': number(),
  resources: object({
    i: object({
      width: number(),
      height: number(),
      src: string()
    })
  }),
  views: array(object({
    coords: array(string()),
    width: number(),
    height: number()
  }))
})

export default class SpeedBinbHandler implements ResourceHandler {
  url: URL;
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(this.withoutTrailingSlash(url.replace('/index.html', '')))

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & descrambling images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  getPtimgUrl(ptimgUrl: string): string {
    return `${this.url.href}/${ptimgUrl}`
  }

  getImgUrl(srcUrl: string): string {
    return `${this.url.href}/data/${srcUrl}`
  }

  async execute(): Promise<JSZip> {
    const resp = await getFromProxy(this.url.href)
    const html = await resp.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const totalPages = doc.querySelectorAll('div[data-ptimg]').length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: Element, index: number) => {
      const ptimgUrl = this.getPtimgUrl(page.getAttribute('data-ptimg')!)
      const resp = await getFromProxy(ptimgUrl)
      const body = await resp.json()

      assert(body, PageSchema)

      const coords = this.getCoords(body.views[0].coords)

      const img = new Image()
      img.crossOrigin = 'Anonymous'
      const srcUrl = this.getImgUrl(body.resources.i.src)
      img.src = getProxiedUrl(srcUrl)
      await img.decode()

      const canvas = document.createElement('canvas')
      canvas.width = body.views[0].width
      canvas.height = body.views[0].height
      const ctx = assertReturn(
        canvas.getContext('2d') ?? undefined,
        `Could not get canvas context for page ${index + 1}`
      )

      coords.forEach(coord => {
        ctx.drawImage(img, coord.srcX, coord.srcY, coord.sWidth, coord.sHeight, coord.destX, coord.destY, coord.dWidth, coord.dHeight);
      })

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, canvasToBuffer(canvas))

      canvas.width = 1
      canvas.height = 1
      ctx.clearRect(0, 0, 1, 1)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(Array.from(doc.querySelectorAll('div[data-ptimg]')).map((page, index) => process(page, index)))

    return this.zipFile
  }

  getCoords(rawCoords: string[]) {
    const coords: {
      srcX: number,
      srcY: number,
      sWidth: number,
      sHeight: number,
      destX: number,
      destY: number,
      dWidth: number,
      dHeight: number
    }[] = [];

    rawCoords.forEach(chunk => {
      chunk = chunk.replace('i:', '');

      const source = chunk.split('>')[0];
      const destination = chunk.split('>')[1];

      const xOffset = parseInt(source.split(',')[0]);
      const yOffset = parseInt(source.split(',')[1].split('+')[0]);
      const xWidth = parseInt(source.split(',')[1].split('+')[1]);
      const yHeight = parseInt(source.split(',')[2]);

      const destX = parseInt(destination.split(',')[0]);
      const destY = parseInt(destination.split(',')[1]);

      coords.push({
        srcX: xOffset,
        srcY: yOffset,
        sWidth: xWidth,
        sHeight: yHeight,
        destX: destX,
        destY: destY,
        dWidth: xWidth,
        dHeight: yHeight
      });
    });

    return coords
  }

  protected withoutTrailingSlash(url: string) {
    return url.endsWith("/") ? url.slice(0, -1) : url
  }
}
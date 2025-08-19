import JSZip from "jszip";
import { ResourceHandler } from "../resources.type";
import { assertReturn, getStandardStates } from "../utils/inlines";
import { getFromProxy } from "../proxy";
import { array, assert, mask, number, object, optional, string, type } from "superstruct";

export const ChapterDataSchema = object({
  body: array(object({
    urls: object({
        thumb_mini: string(),
        small: string(),
        regular: string(),
        original: string(),
    }),
    width: number(),
    height: number()
  }))
})

export default class PixivHandler implements ResourceHandler {
  url: URL;
  id: string
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)
    this.id = assertReturn(
      this.url.pathname.split('/').at(-1)?.split("#")[0],
      'Could not find id in URL.'
    )

    this.states = getStandardStates()
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const resp = await getFromProxy(
      `https://www.pixiv.net/ajax/illust/${this.id}/pages`,
    )

    const rawData = await resp.json()
    const data = mask(rawData, ChapterDataSchema)
    assert(data, ChapterDataSchema)

    const totalPages = data.body.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof data.body[0], index: number) => {

      const resp = await getFromProxy(page.urls.original, {
        referer: "https://www.pixiv.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0"
      })
      const buffer = await resp.arrayBuffer()

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(data.body.map((page, index) => process(page, index)))

    return this.zipFile
  }
}

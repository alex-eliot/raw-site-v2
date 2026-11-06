import JSZip from "jszip";
import type { ResourceHandler } from "../resources.type";
import { assertReturn } from "../utils/inlines";
import crypto from "crypto-js"
import { getFromProxy } from "../proxy";
import { array, assert, number, object, optional, string, type } from "superstruct";

export const ChapterDataSchema = object({
  data: object({
    reading_episode: type({
      pages: array(object({
        gridsize: number(),
        width: number(),
        height: number(),
        url: string(),
        key: optional(string())
      }))
    })
  })
})

export default class ComicPixivHandler implements ResourceHandler {
  url: URL;
  id: string
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)
    this.id = assertReturn(
      this.url.pathname.split('/').at(-1),
      'Could not find id in URL.'
    )

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const date = new Date()
    date.setMilliseconds(0)
    const isoDate = date.toISOString().replace(/\.000Z/, 'Z')
    const preHashString = isoDate + 'mAtW1X8SzGS880fsjEXlM73QpS1i4kUMBhyhdaYySk8nWz533nrEunaSplg63fzT'
    const hash = crypto.SHA256(preHashString).toString(crypto.enc.Hex)

    const resp = await getFromProxy(
      `https://comic.pixiv.net/api/app/episodes/${this.id}/read_v4`,
      {
        referer: this.url.href,
        'x-requested-with': 'pixivcomic',
        'x-client-time': isoDate,
        'x-client-hash': hash
      }
    )

    const data = await resp.json()

    assert(data, ChapterDataSchema)

    const totalPages = data.data.reading_episode.pages.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof data.data.reading_episode.pages[0], index: number) => {
      const originalUrl = new URL(page.url)
      const reformedUrl = new URL(`https://${originalUrl.hostname}/${originalUrl.href.slice(originalUrl.href.indexOf('images'))}`)

      const resp = await getFromProxy(reformedUrl.href, { referer: this.url.href })
      const buffer = await resp.arrayBuffer()

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(data.data.reading_episode.pages.map((page, index) => process(page, index)))

    return this.zipFile
  }
}
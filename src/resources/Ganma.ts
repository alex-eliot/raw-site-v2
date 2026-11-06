import JSZip from "jszip";
import { getFromProxy } from "~/src/proxy";
import type { ResourceHandler } from "~/src/resources.type";
import { assertReturn } from "~/src/utils/inlines";
import { array, assert, string, type } from "superstruct";

const AnnouncementsSchema = type({
  root: type({
    items: array(type({
      id: string(),
      page: type({
        baseUrl: string(),
        id: string(),
        files: array(string()),
        token: string()
      })
    }))
  })
})

const urlRegex = /https:\/\/ganma\.jp\/([^\/]*)\/([^\/]*)/

export default class GanmaHandler implements ResourceHandler {
  url: URL;
  zipFile: JSZip;
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;

  seriesName: string
  seriesId: string

  constructor(url: string) {
    this.url = new URL(url)
    this.zipFile = new JSZip()

    this.states = [
      { name: "Getting API Data", percentage: 0 },
      { name: "Downloading images...", percentage: 0 }
    ]

    this.seriesName = assertReturn(
      this.url.href.match(urlRegex)?.[1],
      "Could not find series name in the URL"
    )

    this.seriesId = assertReturn(
      this.url.href.match(urlRegex)?.[2],
      "Could not find series ID in the URL"
    )

    this.currentStateIndex = 0
  }

  async execute(): Promise<JSZip> {
    const resp = await getFromProxy(`https://ganma.jp/api/1.0/magazines/web/${this.seriesName}`, {
      "X-From": this.url.href
    })
    const data = await resp.json()

    assert(data, AnnouncementsSchema)

    const foundEpisode = assertReturn(
      data.root.items.find(item => item.id === this.seriesId),
      "Could not find series ID in API response"
    )

    const totalPages = foundEpisode.page.files.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex++

    const process = async (baseUrl: string, token: string, file: string, index: number) => {
      const url = `${baseUrl}${file}?${token}`
      const resp = await getFromProxy(url)

      const buffer = await resp.arrayBuffer()
      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)
      pagesComplete++
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(foundEpisode.page.files.map(async (file, index) => process(foundEpisode.page.baseUrl, foundEpisode.page.token, file, index)))

    return this.zipFile
  }
}
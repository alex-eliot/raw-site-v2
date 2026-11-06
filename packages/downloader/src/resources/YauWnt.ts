import JSZip from "jszip"
import type { ResourceHandler } from "../resources.type"
import { array, assert, string } from "superstruct"
import { getResource } from "../transport"

export const PagesSchema = array(string())

export default class YauWntHandler implements ResourceHandler {
  url: URL
  states: { name: string; percentage: number }[]
  currentStateIndex: number
  zipFile: JSZip

  constructor(url: string) {
    this.url = new URL(url)

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading images.', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute() {
    const resp = await getResource(`${this.url}/json`)
    const pages = await resp.json()

    assert(pages, PagesSchema)

    const totalPages = pages.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof pages[0], index: number) => {
      const resp = await getResource(`https://${this.url.hostname}/${page}`)
      const buffer = await resp.arrayBuffer()

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(pages.map(async (page, index) => process(page, index)))

    return this.zipFile
  }
}
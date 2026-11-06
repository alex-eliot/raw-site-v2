import JSZip from "jszip";
import type { ResourceHandler } from "../resources.type";
import { getFromProxy } from "../proxy";
import type { Infer } from "superstruct";
import { array, assert, optional, string, type } from "superstruct";

const NextDataProps = type({
  props: type({
    pageProps: type({
      data: type({
        pages: array(type({
          image: optional(type({
            imageUrl: string()
          })),
        }),)
      })
    })
  })
})

export default class GanGanOnlineHandler implements ResourceHandler {
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
    const resp = await getFromProxy(this.url.href)
    const doc = new DOMParser().parseFromString(await resp.text(), "text/html")
    const json = this.getNextDataFromHtml(doc)

    const allPages = json.props.pageProps.data.pages.filter(<T>(page: { image?: T | undefined }): page is { image: T } => !!page.image)
    const totalPages = allPages.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (imageUrl: string, index: number) => {
      const resp = await getFromProxy(imageUrl)
      const buffer = await resp.arrayBuffer()

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.webp`, buffer)
      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(allPages.map((page, index) => process(this.url.origin + page.image.imageUrl, index)))

    return this.zipFile
  }

  protected getNextDataFromHtml(document: Document) {
    const scriptTag = document.querySelector("#__NEXT_DATA__[type=\"application/json\"]")
    const json = JSON.parse(scriptTag?.innerHTML ?? "{}") as unknown
    assert(json, NextDataProps)
    return json
  }
}

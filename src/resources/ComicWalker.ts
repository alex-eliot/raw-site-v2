import { any, array, assert, enums, nullable, number, object, string, type, union } from "superstruct"
import { getFromProxy } from "../proxy"
import { assertReturn } from "../utils/inlines"
import JSZip from "jszip"
import type { ResourceHandler } from "../resources.type"

const UrlIdRegex = /^https:\/\/comic-walker\.com\/detail\/(KC_.*)\/episodes\/(KC_.*)/
  
export const ContentsPartialSchema = type({
  manuscripts: array(type({
    drmMode: enums(['xor']),
    drmHash: string(),
    drmImageUrl: string(),
    page: number()
  }))
})

export const NextDataPartialSchema = type({
  props: type({
    pageProps: type({
      dehydratedState: type({
        queries: array(type({
          state: type({
            data: union([
              any(),
              type({
                episode: type({
                  id: string()
                })
              })
            ]),
          }),
          queryKey: array(union([string(), object()])),
          queryHash: string()
        }))
      })
    })
  })
})

export default class CommicWalkerHandler implements ResourceHandler {
  url: URL
  episodeCode: string
  workCode: string
  states: { name: string; percentage: number }[]
  currentStateIndex: number
  zipFile: JSZip

  constructor(url: string) {
    this.url = new URL(url)

    this.workCode = assertReturn(
      this.url.href.match(UrlIdRegex)?.[1],
      'Could not find id in the URL.'
    )

    this.episodeCode = assertReturn(
      this.url.href.match(UrlIdRegex)?.[2],
      'Could not find id in the URL.'
    )

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & decoding images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute() {
    const htmlResp = await getFromProxy(this.url.href, {
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }).then(resp => resp.text())
    const domParser = new DOMParser()
    const parsedHtml = domParser.parseFromString(htmlResp, 'text/html')

    const nextData = assertReturn(
      parsedHtml.querySelector('#__NEXT_DATA__')?.textContent ?? undefined,
      'Could not find site next data.'
    )

    const nextDataJson = JSON.parse(nextData)
    assert(nextDataJson, NextDataPartialSchema)

    const episodeId = assertReturn<string>(
      nextDataJson.props.pageProps.dehydratedState.queries.find(query => "episode" in query.state.data)?.state.data.episode.id,
      'Could not get episode id.'
    )

    const resp = await getFromProxy(`https://comic-walker.com/api/contents/viewer?episodeId=${episodeId}&imageSizeType=width%3A1284`, {
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    const contents = await resp.json()

    assert(contents, ContentsPartialSchema)

    const totalPages = assertReturn(
      contents.manuscripts.length,
      'Could not get the total amount of pages.'
    )
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof contents.manuscripts[0], index: number) => {
      const sourceUrl = assertReturn(
        page.drmImageUrl,
        `Could not get source URL for page ${index + 1}.`
      )

      const drmHash = assertReturn(
        page.drmHash,
        `Could not get DRM hash for page ${index + 1}`
      )

      const resp = await getFromProxy(sourceUrl)
      const buffer = await resp.arrayBuffer()

      if (!drmHash) {
        this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, buffer)

        pagesComplete += 1
        this.states[this.currentStateIndex].percentage = pagesComplete / totalPages

        return
      }

      const key: number[] = []
      for (let i = 0; i < 8; i++) {
        key.push(parseInt(drmHash.slice(i * 2, i * 2 + 2), 16));
      }

      const decodedBuffer = new ArrayBuffer(buffer.byteLength)

      const originalBufferDataView = new DataView(buffer)
      const decodedBufferDataView = new DataView(decodedBuffer)

      for (let i = 0; i < buffer.byteLength; i++) {
        decodedBufferDataView.setUint8(i, originalBufferDataView.getUint8(i) ^ key[i % key.length])
      }

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.webp`, decodedBuffer)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(contents.manuscripts.map((page, index) => process(page, index)))

    return this.zipFile
  }
}
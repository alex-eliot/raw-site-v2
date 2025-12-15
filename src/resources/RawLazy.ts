import JSZip from "jszip";
import { ResourceHandler } from "../resources.type";
import { assertReturn, getStandardStates } from "../utils/inlines";
import { getFromProxy, postFromProxy } from "../proxy";
import { array, assert, mask, number, object, optional, string, type } from "superstruct";

export const ImageRequestSchema = object({
  mes: string(),
  going: number(),
  img_index: number()
})
const noncePattern = /"nonce":"(.*?)"/
const chapterIdPattern = /chapter_id: '(.*?)'/
const pPattern = /\sp: (\d+)/
const imageSrcPattern = /src="(.*?)"/g
export default class RawLazyHandler implements ResourceHandler {
  url: URL;
  states: { name: string; percentage: number; }[];
  currentStateIndex: number;
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)

    this.states = [{ name: 'Getting API data.', percentage: 0 }, {name: 'Initializing Download', percentage: 0}]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const resp = await getFromProxy(
      this.url.toString()
    )
    const html = await resp.text()
    const nonce = html.match(noncePattern)![1]
    const chapterId = html.match(chapterIdPattern)![1]
    const p = html.match(pPattern)![1]

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (imgIndex: number) => {
      this.states.push({ name: `Downloading images ${imgIndex+1} & ${imgIndex+2}`, percentage: 0 })
      this.currentStateIndex += 1
      const formData = new FormData();
      formData.append("action", "z_do_ajax")
      formData.append("_action", "decode_images")
      formData.append("p", p)
      formData.append("chapter_id", chapterId)
      formData.append("img_index", imgIndex.toString())
      formData.append("content", "")
      formData.append("nonce", nonce)
      const resp = await postFromProxy(
        "https://rawlazy.io/wp-admin/admin-ajax.php",
        {},
        formData
      )
      const respjson = await resp.json()
      assert(respjson, ImageRequestSchema)
      this.states[this.currentStateIndex].percentage = 0.5
      const responseText = respjson.mes
      for (const match of responseText.matchAll(imageSrcPattern)) {
        console.log(match[1]);
        const imgResp = await getFromProxy(match[1])
        const buffer = await imgResp.arrayBuffer()

        this.zipFile.file(match[1]!.split("/")!.at(-1)!, buffer)
      }
      this.states[this.currentStateIndex].percentage = 1
      return {
        unfinished: respjson.going == 1,
        nextIndex: respjson.img_index
      }
    }
    let nextIndex = 0
    while (true) {
      const res = await process(nextIndex)
      nextIndex = res.nextIndex
      if (!res.unfinished) break
    }

    return this.zipFile
  }
}

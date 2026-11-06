import JSZip from "jszip";
import type { ResourceHandler } from "../../resources.type";
import { assertReturn } from "../../utils/inlines";
import { Position, WebMangaViewerRequest, WebMangaViewerResponse } from "./Contracts";
import { getFromProxy, postFromProxy } from "~/src/proxy";

const firstChapterRegex = /https:\/\/comic-fuz\.com\/manga\/(?<id>[0-9]*)?/
const viewerRegex = /https:\/\/comic-fuz\.com\/manga\/viewer\/(?<id>[0-9]*)?/

export default class ComicFuzHandler implements ResourceHandler {
  url: URL;
  id: number
  states: { name: string; percentage: number; }[];
  currentStateIndex: number
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)
    this.id = Number(assertReturn(firstChapterRegex.exec(url)?.groups?.id || viewerRegex.exec(url)?.groups?.id, "Could not find id in the URL."))
    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & descrambling images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const isViewerChapter = viewerRegex.test(this.url.href)

    const req = !isViewerChapter
      ? {
          chapterArgument: {
            mangaId: this.id,
            position: Position.DETAIL
          },
          useTicket: false,
          userPoint: {
            event: 0,
            paid: 0
          },
          deviceInfo: {
            deviceType: 3
          }
        }
      : {
          chapterId: this.id,
          useTicket: false,
          userPoint: {
            event: 0,
            paid: 0
          },
          deviceInfo: {
            deviceType: 3
          }
        }

    const requestBody = new Uint8Array(WebMangaViewerRequest.encode(req).finish())
    const resp = await postFromProxy(`https://api.comic-fuz.com/v1/web_manga_viewer`, {}, requestBody)

    const buf = new Uint8Array(await resp.arrayBuffer())
    const body = WebMangaViewerResponse.decode(buf)

    let pagesComplete = 0
    const totalPages = body.viewerData.pages.length

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const updateState = () => {
      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(body.viewerData.pages.map(async (page, index) => {
      if (!page.image) return updateState()
      if (page.image.isExtraPage) return updateState()

      const resp = await getFromProxy(`https://img.comic-fuz.com` + page.image.imageUrl)
      const buf = await resp.arrayBuffer()

      if (page.image.encryptionKey && page.image.iv) {
        const key = await importKey(page.image.encryptionKey)
        const decrypted = await decryptData(buf, key, page.image.iv)
        this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpeg`, decrypted)
      } else {
        this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpeg`, buf)
      }

      updateState()
    }))

    return this.zipFile
  }
}

const unhex = (t: string) => {
  const e = t.match(/.{1,2}/g);
  return new Uint8Array(e!.map((function(t) {
    return parseInt(t, 16)
  })))
}

async function importKey(rawKey: string) {
  // Import the key using the Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',           // Key format
    unhex(rawKey),       // Key data
    { name: 'AES-CBC' }, // Algorithm
    false,           // Whether the key is extractable (cannot be exported)
    ['decrypt']      // Key usages
  );

  return cryptoKey;
}

async function decryptData(encryptedBuffer: ArrayBuffer, key: CryptoKey, iv: string) {
  // Perform decryption using the Web Crypto API
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: unhex(iv),
    },
    key,               // The CryptoKey object
    encryptedBuffer    // The data to decrypt
  );

  return decryptedBuffer; // Returns an ArrayBuffer containing the decrypted data
}

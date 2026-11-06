import JSZip from "jszip"
import type { ResourceHandler } from "../resources.type"
import type { Infer } from "superstruct"
import { any, array, assert, is, literal, nullable, object, optional, string, type, union, unknown } from "superstruct"
import { getFromProxy } from "../proxy"
import { assertReturn } from "../utils/inlines"

const ViewerSectionSchema = type({
  viewerSection: type({
    pages: array(type({
      crypto: optional(type({
        method: literal('aes-cbc'),
        key: string(),
        iv: string(),
      })),
      src: string(),
    }))
  })
})

export const NextDataSchema = array(union([
  string(),
  literal(null),
  type({
    children: array(union([
      string(),
      array(union([
        string(),
        literal(null),
        any(),
      ]))
    ]))
  })
]))

export default class FlowerComicsHandler implements ResourceHandler {
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
    const resp = await getFromProxy(this.url.href)
    const text = await resp.text()

    const dataRaw = assertReturn(
      text.match(
        /16:(?<data>.*)$/
      )?.groups?.data,
      'Could not find nextjs data in response body.'
    )

    const data = JSON.parse(
      dataRaw
        .slice(0, dataRaw.indexOf("\x3C"))
        .replaceAll("\\n", "")
        .replaceAll("\\{", "")
        .replaceAll("\\}", "")
        .replaceAll("\\\"", "\"")
        .slice(0, -3)
    )
 
    assert(data, NextDataSchema)

    const config = assertReturn(
      data.find(<T>(d: T | null | string): d is T => typeof d === 'object' && d !== null),
      "Could not find config object in nextjs data."
    )

    const viewerConfig = assertReturn(
      config.children.reduce((found, current) => {
        if (found) return found

        if (typeof current === 'object' && current !== null) {
          return current.reduce((found, current) => {
            if (found) return found

            if (typeof current === 'object' && current !== null && "viewerSection" in current && is(current, ViewerSectionSchema)) {
              return current
            }

            return found
          }, null)
        }

        return found
      }, null) as unknown as Infer<typeof ViewerSectionSchema>,
      "Could not find viewerSection object in nextjs data."
    )

    const pages = viewerConfig.viewerSection.pages
    const totalPages = pages.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof pages[0], index: number) => {
      const resp = await getFromProxy(page.src)

      if (resp.status !== 200) throw new Error(`Failed to download page ${index + 1}.`)

      const buffer = await resp.arrayBuffer()

      let decryptedBuffer: ArrayBuffer

      if (!page.crypto) {
        decryptedBuffer = buffer
      } else {
        const key = await importKey(page.crypto.key)
        decryptedBuffer = await decryptData(buffer, key, page.crypto.iv)
      }

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, await reencodeImage(decryptedBuffer, 'image/jpeg'))

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(pages.map(async (page, index) => process(page, index)))

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

async function reencodeImage(buffer: ArrayBuffer, mimeType = 'image/png'): Promise<ArrayBuffer> {
  if (!buffer) throw new Error('ArrayBuffer is required');

  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to extract image from canvas'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Failed to read blob as ArrayBuffer'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read blob as ArrayBuffer'));
        reader.readAsArrayBuffer(blob);
      }, mimeType);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}


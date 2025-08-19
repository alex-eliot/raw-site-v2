import JSZip from "jszip";
import { ResourceHandler } from "../resources.type";
import { assertReturn, getStandardStates } from "../utils/inlines";
import { getFromProxy } from "../proxy";
import crypto from "crypto-js";
import { array, assert, mask, number, object, optional, string, type } from "superstruct";
const preserveRight = 4;
const gridSize = 4;

export const ChapterDataSchema = object({
  status: string(),
  error_code: optional(string()),
  scramble_seed: number(),
  page_list: array(string()),
})

export default class CiaoShogakukanHandler implements ResourceHandler {
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

    this.states = getStandardStates()
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  private async unscrambleImage(
      inputBuffer: ArrayBuffer,
      scrambleSeed: number,
  ): Promise<Uint8Array<ArrayBuffer>> {
      const blob = new Blob([inputBuffer]);
      const imageUrl = URL.createObjectURL(blob);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(
        image,
        image.width - preserveRight, 0,
        preserveRight, image.height,
        image.width - preserveRight, 0,
        preserveRight, image.height
      );

      const activeWidth = image.width - preserveRight;
      const tileSize = {
        width: Math.floor(activeWidth / gridSize),
        height: Math.floor(image.height / gridSize)
      };

      for (const { source, dest } of this.generateTileMap(gridSize, scrambleSeed)) {
        ctx.drawImage(
          image,
          source.x * tileSize.width,
          source.y * tileSize.height,
          tileSize.width,
          tileSize.height,
          dest.x * tileSize.width,
          dest.y * tileSize.height,
          tileSize.width,
          tileSize.height
        );
      }

      return canvasToBuffer(canvas)
  }

  private *generatePRNG(seed: number): Generator<number> {
    let state = seed >>> 0;
    while (true) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      yield state >>> 0;
    }
  }

  private deterministicShuffle<T>(array: T[], seed: number): T[] {
    const rand = this.generatePRNG(seed);
    return array
      .map((item) => [rand.next().value, item] as [number, T])
      .sort((a, b) => a[0] - b[0])
      .map(([_, item]) => item);
  }

  private *generateTileMap(gridSize: number, seed: number): Generator<{
    source: { x: number; y: number };
    dest: { x: number; y: number };
  }> {
    const total = gridSize * gridSize;
    const indices = Array.from({ length: total }, (_, i) => i);
    const shuffled = this.deterministicShuffle(indices, seed);

    for (let destIndex = 0; destIndex < total; destIndex++) {
      const sourceIndex = shuffled[destIndex];
      yield {
        source: {
          x: sourceIndex % gridSize,
          y: Math.floor(sourceIndex / gridSize)
        },
        dest: {
          x: destIndex % gridSize,
          y: Math.floor(destIndex / gridSize)
        }
      };
    }
  }

  //Hash calculation function
  private calculateHash(params: Record<string, string>): string {
    const keys = Object.keys(params).sort();
    const hashtable = [];
    for (const key of keys) {
        const keyHash = crypto.SHA256(key).toString(crypto.enc.Hex)
        const valueHash = crypto.SHA512(params[key]).toString(crypto.enc.Hex)
        hashtable.push([keyHash, valueHash].join('_'));
    }
    const bambihash = crypto.SHA256(hashtable.toString()).toString(crypto.enc.Hex);
    return crypto.SHA512(bambihash).toString(crypto.enc.Hex);
  }

  //Main execution function
  async execute(): Promise<JSZip> {
    const bambihash = this.calculateHash({
      "version": "6.0.0",
      "platform": "3",
      "episode_id": this.id.toString()
    })

    const resp = await getFromProxy(
      `https://api.ciao.shogakukan.co.jp/web/episode/viewer?version=6.0.0&platform=3&episode_id=${this.id}`,
      {
        'x-bambi-hash': bambihash,
      }
    )

    const rawData = await resp.json()

    const data = mask(rawData, ChapterDataSchema)

    assert(data, ChapterDataSchema)

    const totalPages = data.page_list.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (pageUrl: typeof data.page_list[0], index: number) => {
      const resp = await getFromProxy(pageUrl)
      const buffer = await resp.arrayBuffer()

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, await this.unscrambleImage(buffer, data.scramble_seed))

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(data.page_list.map((page, index) => process(page, index)))

    return this.zipFile
  }
}

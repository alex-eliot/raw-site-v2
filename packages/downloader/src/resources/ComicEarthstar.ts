import JSZip from "jszip";
import type { ResourceHandler } from "../resources.type";
import { assertReturn } from "../utils/inlines";
import { getResource, loadImage } from "../transport";
import { canvasToBuffer } from "../canvas";
import type { Infer } from "superstruct";
import { array, assert, enums, number, object, string, type } from "superstruct";

export const MetadataResponseSchema = type({
  status: string(),
  url: string()
})

export const ConfigurationPackSchema = type({
  configuration: type({
    contents: array(object({
      file: string(),
      index: number(),
      'original-file-path': string(),
      type: enums(['bmp'])
    }))
  })
})

export default class ComicEarthstarHandler implements ResourceHandler {
  url: URL;
  id: string
  states: { name: string; percentage: number; }[];
  currentStateIndex: number
  zipFile: JSZip;

  constructor(url: string) {
    this.url = new URL(url)
    this.id = assertReturn(
      this.url.searchParams.get('cid') ?? undefined,
      'Could not find id in the URL.'
    )

    this.states = [
      { name: 'Getting API data.', percentage: 0 },
      { name: 'Downloading & descrambling images', percentage: 0 },
    ]
    this.currentStateIndex = 0

    this.zipFile = new JSZip()
  }

  async execute(): Promise<JSZip> {
    const resp = await getResource(`https://api.comic-earthstar.jp/c.php?cid=${this.id}`)
    const meta = await resp.json()

    assert(meta, MetadataResponseSchema)

    const baseUrl = `${meta.url}`

    const configPackResp = await getResource(baseUrl + 'configuration_pack.json')
    const configPack = await configPackResp.json()

    assert(configPack, ConfigurationPackSchema)

    const totalPages = configPack.configuration.contents.length
    let pagesComplete = 0

    this.states[this.currentStateIndex].percentage = 1
    this.currentStateIndex += 1

    const process = async (page: typeof configPack.configuration.contents[0], index: number) => {
      const img = await loadImage(baseUrl + page.file + '/0.jpeg')

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = assertReturn(
        canvas.getContext('2d') ?? undefined,
        'Could not initialize canvas context for original canvas.'
      )

      const coords = this.getDescramblingCoords(page.file, [img.width, img.height])

      coords.forEach(coord => {
        ctx.drawImage(img, coord.srcX, coord.srcY, coord.width, coord.height, coord.destX, coord.destY, coord.width, coord.height);
      });

      this.zipFile.file(`${(index + 1).toString().padStart(3, '0')}.jpg`, canvasToBuffer(canvas))

      canvas.width = 1
      canvas.height = 1
      ctx.clearRect(0, 0, 1, 1)

      pagesComplete += 1
      this.states[this.currentStateIndex].percentage = pagesComplete / totalPages
    }

    await Promise.all(configPack.configuration.contents.map((page, index) => process(page, index)))

    return this.zipFile
  }

  getDescramblingCoords(fileNameOnConfigPack: string, size: [number, number]) {
    const setPattern = (fileLink: string) => {
      let u = 0;
      for (var i = 0; i < fileLink.length; i++) {
        u += fileLink.charCodeAt(i);
      };
      const pattern = (u % 4) + 1;

      return pattern;
    };

    const calcPositionWithRest_ = (a: number, f: number, b: number, e: number) => {
      return a >= f ? a * e + b : a * e;
    };

    const calcXCoordinateXRest_ = (a: number, f: number, b: number) => {
      return (a + 61 * b) % f;
    };

    const calcYCoordinateXRest_ = (a: number, f: number, b: number, e: number, d: number) => {
      var c = 1 === d % 2;
      c = a < f ? c : !c;
      if (c) {
        e = b;
        f = 0;
      } else {
        e -= b;
        f = b;
      };

      return (a + 53 * d + 59 * b) % e + f;
    };

    const calcXCoordinateYRest_ = (a: number, f: number, b: number, e: number, d: number) => {
      var c = 1 === d % 2;
      c = a < b ? c : !c;
      if (c) {
        e -= f;
        b = f;
      } else {
        e = f;
        b = 0;
      };

      return (a + 67 * d + f + 71) % e + b;
    };

    const calcYCoordinateYRest_ = (a: number, f: number, b: number) => {
      return (a + 73 * b) % f;
    };

    const pattern = setPattern(fileNameOnConfigPack + '/0');

    const chunksX = Math.floor(size[0] / 64);
    const chunksY = Math.floor(size[1] / 64);

    const remainingWidth = size[0] % 64;
    const remainingHeight = size[1] % 64;

    let srcXInCoords = chunksX - 43 * pattern % chunksX;

    if (0 === srcXInCoords % chunksX) {
      srcXInCoords = (chunksX - 4) % chunksX;

      if (0 === srcXInCoords) {
        srcXInCoords = chunksX - 1;
      };
    };

    let srcYInCoords = chunksY - 47 * pattern % chunksY;

    if (0 === srcYInCoords % chunksY) {
      srcYInCoords = (chunksY - 4) % chunksY;

      if (0 == srcYInCoords) {
        srcYInCoords = chunksY - 1;
      };
    };

    const coords = [];

    let p, k, r, m;

    if (remainingHeight > 0) {
      for (var i = 0; i < chunksX; i++) {
        p = calcXCoordinateXRest_(i, chunksX, pattern);
        k = calcYCoordinateXRest_(p, srcXInCoords, srcYInCoords, chunksY, pattern);
        p = calcPositionWithRest_(p, srcXInCoords, remainingWidth, 64);
        r = k * 64;
        k = calcPositionWithRest_(i, srcXInCoords, remainingWidth, 64);
        m = srcYInCoords * 64;

        coords.push({
          "srcX": p,
          "srcY": r,
          "destX": k,
          "destY": m,
          "width": 64,
          "height": remainingHeight
        });
      };
    };

    if (remainingWidth > 0) {
      for (var i = 0; i < chunksY; i++) {
        k = calcYCoordinateYRest_(i, chunksY, pattern);
        p = calcXCoordinateYRest_(k, srcXInCoords, srcYInCoords, chunksX, pattern);
        p *= 64;
        r = calcPositionWithRest_(k, srcYInCoords, remainingHeight, 64);
        k = srcXInCoords * 64;
        m = calcPositionWithRest_(i, srcYInCoords, remainingHeight, 64);

        coords.push({
          "srcX": p,
          "srcY": r,
          "destX": k,
          "destY": m,
          "width": remainingWidth,
          "height": 64
        });
      };
    };

    for (var i = 0; i < chunksX; i++) {
      for (var j = 0; j < chunksY; j++) {
        p = (i + 29 * pattern + 31 * j) % chunksX;
        k = (j + 37 * pattern + 41 * p) % chunksY;
        if (p >= calcXCoordinateYRest_(k, srcXInCoords, srcYInCoords, chunksX, pattern)) {
          r = remainingWidth;
        } else {
          r = 0;
        };

        if (k >= calcYCoordinateXRest_(p, srcXInCoords, srcYInCoords, chunksY, pattern)) {
          m = remainingHeight;
        } else {
          m = 0;
        };

        p = p * 64 + r;
        r = k * 64 + m;

        if (i >= srcXInCoords) {
          k = i * 64 + remainingWidth;
        } else {
          k = i * 64;
        };

        if (j >= srcYInCoords) {
          m = j * 64 + remainingHeight;
        } else {
          m = j * 64;
        };

        coords.push({
          "srcX": p,
          "srcY": r,
          "destX": k,
          "destY": m,
          "width": 64,
          "height": 64
        });
      };
    };

    return coords;
  }
}
import SpeedBinbHandler from "./SpeedBinb";

export default class KirapoHandler extends SpeedBinbHandler {
  getPtimgUrl(ptimgUrl: string): string {
    const baseUrl = this.url.href.replace(/viewer$/, '')
    return `${baseUrl}/${ptimgUrl}`
  }

  getImgUrl(srcUrl: string): string {
    const baseUrl = this.url.href.replace(/viewer$/, '')
    return `${baseUrl}/data/${srcUrl}`
  }
}

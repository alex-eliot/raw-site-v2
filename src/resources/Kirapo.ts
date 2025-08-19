import SpeedBinbHandler from "./SpeedBinb";

export default class KirapoHandler extends SpeedBinbHandler {
  get_ptimg_url(ptimg_url: string): string {
    const base_url = this.url.href.replace(/viewer$/, '')
    return `${base_url}/${ptimg_url}`
  }

  get_img_url(src_url: string): string {
    const base_url = this.url.href.replace(/viewer$/, '')
    return `${base_url}/data/${src_url}`
  }
}

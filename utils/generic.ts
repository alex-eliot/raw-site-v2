import JSZip from "jszip";
import { nanoid } from "nanoid";
import { Infer, validate } from "superstruct";
import { ValidProxiedHosts } from "~/src/proxy";
import ComicEarthstarHandler from "~/src/resources/ComicEarthstar";
import ComicPixivHandler from "~/src/resources/ComicPixiv";
import CommicWalkerHandler from "~/src/resources/ComicWalker";
import FireCrossHandler from "~/src/resources/FireCross";
import GigaViewHandler from "~/src/resources/GigaView";
import SpeedBinbHandler from "~/src/resources/SpeedBinb";
import YanMangaHandler from "~/src/resources/YanManga";
import YauWntHandler from "~/src/resources/YauWnt";
import ComiciHandler from "~/src/resources/Comici";
import { assertReturn } from "~/src/utils/inlines";
import GanmaHandler from "~/src/resources/Ganma";
import ComicFuzHandler from "~/src/resources/ComicFuz/ComicFuz";
import FlowerComicsHandler from "~/src/resources/FlowerComics";
import GanGanOnlineHandler from "~/src/resources/GanGanOnline";

export async function downloadZipFile(zipFile: JSZip) {
  const zipBlob = await zipFile.generateAsync({ type: 'blob' })

  const url = URL.createObjectURL(zipBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${nanoid(16)}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function canvasToBuffer(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL('image/jpeg', 1)
  const buffer = Uint8Array.from(
    window.atob(dataUrl.split(',')[1]),
    c => c.charCodeAt(0)
  )

  return buffer
}

export const hostMap = new Map<Infer<typeof ValidProxiedHosts>, typeof GigaViewHandler>()
hostMap.set('comic-action.com', GigaViewHandler)
hostMap.set('comic-days.com', GigaViewHandler)
hostMap.set('viewer.comic-earthstar.jp', ComicEarthstarHandler)
hostMap.set('comic-gardo.com', GigaViewHandler)
hostMap.set('comic-meteor.jp', SpeedBinbHandler)
hostMap.set('comic-polaris.jp', SpeedBinbHandler)
hostMap.set('www.comicride.jp', SpeedBinbHandler)
hostMap.set('michikusacomics.jp', SpeedBinbHandler)
hostMap.set('comic-trail.com', GigaViewHandler)
hostMap.set('comic-zenon.com', GigaViewHandler)
hostMap.set('comic.pixiv.net', ComicPixivHandler)
hostMap.set('comic-walker.com', CommicWalkerHandler)
hostMap.set('comic.webnewtype.com', YauWntHandler)
hostMap.set('comicborder.com', GigaViewHandler)
hostMap.set('firecross.jp', FireCrossHandler)
hostMap.set('gammaplus.takeshobo.co.jp', SpeedBinbHandler)
hostMap.set('gaugau.futabanet.jp', SpeedBinbHandler)
hostMap.set('kuragebunch.com', GigaViewHandler)
hostMap.set('magcomi.com', GigaViewHandler)
hostMap.set('manga.zerosumonline.com', SpeedBinbHandler)
hostMap.set('pocket.shonenmagazine.com', GigaViewHandler)
hostMap.set('shonenjumpplus.com', GigaViewHandler)
hostMap.set('static.ichijinsha.co.jp', SpeedBinbHandler)
hostMap.set('tonarinoyj.jp', GigaViewHandler)
hostMap.set('viewer.heros-web.com', GigaViewHandler)
hostMap.set('web-ace.jp', YauWntHandler)
hostMap.set('www.123hon.com', SpeedBinbHandler)
hostMap.set('www.comic-brise.com', SpeedBinbHandler)
hostMap.set('www.sunday-webry.com', GigaViewHandler)
hostMap.set('yanmaga.jp', YanMangaHandler)
hostMap.set('youngchampion.jp', ComiciHandler)
hostMap.set('bigcomics.jp', ComiciHandler)
hostMap.set('younganimal.com', ComiciHandler)
hostMap.set('comic-earthstar.com', GigaViewHandler)
hostMap.set('comics.manga-bang.com', ComiciHandler)
hostMap.set('ganma.jp', GanmaHandler)
hostMap.set('www.comic-valkyrie.com', SpeedBinbHandler)
hostMap.set("comic-fuz.com", ComicFuzHandler)
hostMap.set('carula.jp', ComiciHandler)
hostMap.set('championcross.jp', ComiciHandler)
hostMap.set('flowercomics.jp', FlowerComicsHandler)
hostMap.set('www.ganganonline.com', GanGanOnlineHandler)
hostMap.set('comic-growl.com', GigaViewHandler)
hostMap.set('storia.takeshobo.co.jp', SpeedBinbHandler)
export function mapUrlToHandler(url: string): typeof GigaViewHandler {
  const host = new URL(url).hostname

  const assuredHost = assertReturn(
    validate(host, ValidProxiedHosts)[1],
    'Unsupported domain.'
  )

  return hostMap.get(assuredHost)!
}
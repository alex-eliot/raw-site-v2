import type { Infer } from "superstruct"
import { validate } from "superstruct"
import type { ResourceHandler } from "./resources.type"
import { ValidProxiedHosts } from "./hosts"
import { assertReturn } from "./utils/inlines"
import ComicEarthstarHandler from "./resources/ComicEarthstar"
import ComicPixivHandler from "./resources/ComicPixiv"
import CommicWalkerHandler from "./resources/ComicWalker"
import FireCrossHandler from "./resources/FireCross"
import GigaViewHandler from "./resources/GigaView"
import SpeedBinbHandler from "./resources/SpeedBinb"
import YanMangaHandler from "./resources/YanManga"
import YauWntHandler from "./resources/YauWnt"
import ComiciHandler from "./resources/Comici"
import GanmaHandler from "./resources/Ganma"
import ComicFuzHandler from "./resources/ComicFuz/ComicFuz"
import FlowerComicsHandler from "./resources/FlowerComics"
import GanGanOnlineHandler from "./resources/GanGanOnline"
import CiaoShogakukanHandler from "./resources/CiaoShogakukan"
import PixivHandler from "./resources/Pixiv"
import PocketMagazineHandler from "./resources/PocketMagazine"
import KirapoHandler from "./resources/Kirapo"

export const hostMap = new Map<Infer<typeof ValidProxiedHosts>, new (url: string) => ResourceHandler>()
hostMap.set('comic-action.com', GigaViewHandler)
hostMap.set('comic-days.com', GigaViewHandler)
hostMap.set('viewer.comic-earthstar.jp', ComicEarthstarHandler)
hostMap.set('comic-gardo.com', GigaViewHandler)
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
hostMap.set('pocket.shonenmagazine.com', PocketMagazineHandler)
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
hostMap.set('ciao.shogakukan.co.jp', CiaoShogakukanHandler)
hostMap.set('www.pixiv.net', PixivHandler)
hostMap.set('kirapo.jp', KirapoHandler)

export function mapUrlToHandler(url: string): new (url: string) => ResourceHandler {
  const host = new URL(url).hostname

  const assuredHost = assertReturn(
    validate(host, ValidProxiedHosts)[1],
    'Unsupported domain.'
  )

  return hostMap.get(assuredHost)!
}

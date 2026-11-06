import pkg from 'protobufjs/light.js';
const { Field, Type, Message } = pkg;

@Type.d("DeviceInfo")
class DeviceInfo extends Message<DeviceInfo> {
  @Field.d(1, "string")
  public secret!: string

  @Field.d(2, "string")
  public appVer!: string

  @Field.d(3, "int32")
  public deviceType!: number

  @Field.d(4, "string")
  public osVer!: string

  @Field.d(5, "bool")
  public isTablet!: boolean

  @Field.d(6, "int32")
  public imageQuality!: number
}

export enum Position {
  FIRST = 0,
  LAST = 1,
  DETAIL = 2
}

@Type.d("UserPointPaidAndEvent")
export class UserPointPaidAndEvent extends Message<UserPointPaidAndEvent> {
  @Field.d(1, "uint32")
  public event?: number
  @Field.d(2, "uint32")
  public paid?: number
}

@Type.d("ChapterArgument")
export class ChapterArgument extends Message<ChapterArgument> {
  @Field.d(1, "uint32", "required")
  public mangaId!: number

  @Field.d(2, "uint32")
  public position!: Position
}

@Type.d("WebMangaViewerRequest")
export class WebMangaViewerRequest extends Message<WebMangaViewerRequest> {
  @Field.d(1, DeviceInfo)
  public deviceInfo?: DeviceInfo

  @Field.d(2, "bool")
  public useTicket!: boolean

  @Field.d(3, UserPointPaidAndEvent)
  public userPoint!: UserPointPaidAndEvent

  @Field.d(4, "uint32")
  public chapterId!: number

  @Field.d(5, ChapterArgument)
  chapterArgument!: ChapterArgument
}

@Type.d("AuthorUser")
export class AuthorUser extends Message<AuthorUser> {
  @Field.d(1, "uint32", "required")
  public id!: number
  
  @Field.d(2, "string")
  public name?: string

  @Field.d(3, "string")
  public nameKana?: string

  @Field.d(4, "string")
  public role?: string
}

@Type.d("Image")
class Image extends Message<Image> {
  @Field.d(1, "string")
  public imageUrl!: string

  @Field.d(2, "string")
  public urlScheme?: string

  @Field.d(3, "string")
  public iv?: string

  @Field.d(4, "string")
  public encryptionKey?: string

  @Field.d(5, "uint32", "required")
  public imageWidth!: string

  @Field.d(6, "uint32", "required")
  public imageHeight!: string

  @Field.d(7, "bool")
  public isExtraPage?: boolean

  @Field.d(8, "uint32")
  public extraId?: number

  @Field.d(9, "uint32")
  public extraIndex?: number

  @Field.d(10, "uint32")
  public extraSlotId?: number
}

@Type.d("WebView")
class WebView extends Message<WebView> {
  @Field.d(1, "string")
  public url!: string
}

@Type.d("LastPage")
class LastPage extends Message<LastPage> {

}

@Type.d("ViewerPage")
class ViewerPage extends Message<ViewerPage> {
  @Field.d(1, Image)
  image?: Image

  @Field.d(2, WebView)
  webview!: WebView

  @Field.d(3, LastPage)
  lastPage?: LastPage
}

@Type.d("ViewerData")
class ViewerData extends Message<ViewerData> {
  @Field.d(1, "string")
  public viewerTitle!: string
  
  @Field.d(2, ViewerPage, "repeated")
  public pages!: ViewerPage[]

  @Field.d(3, "int32")
  public scroll?: number

  @Field.d(4, "bool")
  public isFirstPageBlank?: boolean

  @Field.d(5, "int32")
  public scrollOption?: number
}

@Type.d("UserPointFreeAndPaid")
class UserPointFreeAndPaid extends Message<UserPointFreeAndPaid> {
  @Field.d(1, "uint32")
  public free?: number
  @Field.d(2, "uint32")
  public paid?: number
}

@Type.d("WebMangaViewerResponse")
export class WebMangaViewerResponse extends Message<WebMangaViewerResponse> {
  @Field.d(1, UserPointFreeAndPaid)
  public userPoint?: UserPointFreeAndPaid

  @Field.d(2, ViewerData)
  public viewerData!: ViewerData
}

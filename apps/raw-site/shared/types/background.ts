export interface Background {
  src: string
  orientation: 'portrait' | 'landscape'
  credit: {
    pixiv: string | null,
    twitter: string | null,
    original: string
  }
}

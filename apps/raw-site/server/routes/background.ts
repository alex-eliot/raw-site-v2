import { assertReturn } from "@raw-downloader/downloader/inlines"
import type { Background } from "~~/shared/types/background"

const backgrounds: Background[] = [
  {
    src: `/bg/101921864_p0.jpg`,
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/54777697',
      twitter: 'https://twitter.com/Basic_Arenazero',
      original: 'https://www.pixiv.net/en/artworks/101921864'
    }
  },
  {
    src: '/bg/106403528_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/10885193',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/106403528'
    }
  },
  {
    src: '/bg/86055822_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/14795980',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/86055822'
    }
  },
  {
    src: '/bg/80611643_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/14795980',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/80611643'
    }
  },
  {
    src: '/bg/82804832_p0.jpg',
    orientation: 'portrait',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/13748549',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/82804832'
    }
  },
  {
    src: '/bg/104391640_p0.jpg',
    orientation: 'portrait',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/104391640'
    }
  },
  {
    src: '/bg/64050984_p0.jpg',
    orientation: 'portrait',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/64050984'
    }
  },
  {
    src: '/bg/72878888_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/72878888'
    }
  },
  {
    src: '/bg/79766400_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/79766400'
    }
  },
  {
    src: '/bg/104359475_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/104359475'
    }
  },
  {
    src: '/bg/104466522_p0.jpg',
    orientation: 'portrait',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/104466522'
    }
  },
  {
    src: '/bg/84697502_p0.jpg',
    orientation: 'portrait',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/7210261',
      twitter: 'https://twitter.com/QYSThree',
      original: 'https://www.pixiv.net/en/artworks/84697502'
    }
  },
  {
    src: '/bg/99917810_p2.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/44612817',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/99917810'
    }
  },
  {
    src: '/bg/84349056_p1.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/44612817',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/84349056'
    }
  },
  {
    src: '/bg/99817334_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/78280527',
      twitter: null,
      original: 'https://www.pixiv.net/en/artworks/99817334'
    }
  },
  {
    src: '/bg/99934472_p0.jpg',
    orientation: 'landscape',
    credit: {
      pixiv: 'https://www.pixiv.net/en/users/56640408',
      twitter: 'https://twitter.com/Aoi___Tsuki',
      original: 'https://www.pixiv.net/en/artworks/99934472'
    }
  }
]

export default defineEventHandler((event) => {
  const orientation = getQuery(event).orientation

  const assurredOrientation = assertReturn(
    orientation as string | undefined,
    'Orientation must be a string'
  )

  const filteredBackgrounds = backgrounds.filter(background => background.orientation === assurredOrientation)

  return filteredBackgrounds[Math.floor(Math.random() * filteredBackgrounds.length)]
})
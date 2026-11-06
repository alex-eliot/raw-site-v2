// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: '.',
  css: [
    '@/assets/css/main.css'
  ],
  build: {
    transpile: ['@raw-downloader/downloader']
  },
  nitro: {
    externals: {
      inline: ['crypto-js', 'protobufjs']
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      exclude: ['@raw-downloader/downloader']
    }
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false
      }
    }
  }
})

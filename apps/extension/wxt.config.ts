import { defineConfig } from 'wxt'
import { HostPermissions } from '@raw-downloader/downloader/hosts'

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-vue'],
  manifest: ({ browser }) => ({
    name: 'Raw Downloader',
    description: 'Download images from supported comic readers.',
    version: '0.1.0',
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      96: '/icon/96.png',
      128: '/icon/128.png'
    },
    host_permissions: HostPermissions,
    action: {
      default_title: 'Open Raw Downloader'
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'raw-downloader@example.com',
              data_collection_permissions: {
                required: ['none']
              }
            }
          }
        }
      : {})
  })
})

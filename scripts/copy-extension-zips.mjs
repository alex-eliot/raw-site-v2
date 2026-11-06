import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(scriptDir, '..')
const publicDir = join(rootDir, 'apps/raw-site/public/extension')
const outputDirs = [
  join(rootDir, 'apps/extension/.output'),
  join(rootDir, 'apps/extension/output')
]

let chromeZip
let firefoxZip

for (const outputDir of outputDirs) {
  if (!existsSync(outputDir))
    continue

  const files = await readdir(outputDir)
  const chrome = files.find(file => file.endsWith('-chrome.zip'))
  const firefox = files.find(file => file.endsWith('-firefox.zip'))

  if (!chromeZip && chrome)
    chromeZip = join(outputDir, chrome)

  if (!firefoxZip && firefox)
    firefoxZip = join(outputDir, firefox)
}

if (!chromeZip || !firefoxZip)
  throw new Error('Extension zips not found. Run `pnpm build:extensions` first.')

await mkdir(publicDir, { recursive: true })
await copyFile(chromeZip, join(publicDir, 'raw-downloader-chrome.zip'))
await copyFile(firefoxZip, join(publicDir, 'raw-downloader-firefox.zip'))

console.log(`Copied extension downloads to ${publicDir}`)

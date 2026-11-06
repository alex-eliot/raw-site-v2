## Raw Downloader

This is a utility to download images from various comic-reading sites for local use.

## Structure

This is a pnpm monorepo:

- `apps/raw-site` — Nuxt web app (server-side proxy + UI)
- `apps/extension` — Chrome/Firefox extension built with WXT
- `packages/downloader` — shared extraction core used by both apps

## Running

1. Install NodeJS and pnpm (`npm i -g pnpm`)
2. `pnpm install`
3. `pnpm dev`

The root scripts proxy to the `raw-site` workspace. You can also run them directly with `pnpm --filter raw-site dev`.

## Production with PM2

PM2 is included as a root dev dependency. Build the site, then start it:

1. `pnpm install`
2. `pnpm build`
3. `pnpm start`

The app listens on port `4006` by default. Override it with `PORT=5000 pnpm start`. After rebuilding, use `pnpm reload`; use `pnpm stop` to remove it and `pnpm logs` to follow logs.

To start on boot, run `pnpm exec pm2 startup` and `pnpm exec pm2 save` after starting the app.

## Browser extensions

The extension exposes a popup with a content script. The popup drives the shared extractor inside the current tab, so requests run on the reader page's origin and automatically use that site's cookies, referrer, and browser headers.

- `pnpm dev:extension` — Chrome dev mode
- `pnpm dev:extension:firefox` — Firefox dev mode
- `pnpm build:extension` — build Chrome extension
- `pnpm build:extension:firefox` — build Firefox extension
- `pnpm zip:extension` / `pnpm zip:extension:firefox` — create store-ready zips

Builds are written to `apps/extension/.output/`. Load the generated directory as an unpacked extension while developing.

`pnpm build` also builds both extension ZIPs and copies them into `apps/raw-site/public/extension/` for the site's download buttons. Use `pnpm build:site` if you only want to rebuild the web app.

Usage: open a supported reader page, click the extension icon, and start the extraction from the popup. The ZIP is downloaded from the page context. Cross-origin API hosts still need to allow the page's origin (CORS), and headers that browsers forbid cannot be overridden manually.

## Contributing

### New sources

Many comic sites share the same readers, and the way they behave is mostly the same. If you want to add a source for which an already-existing resource handler can work:

1. Assign the specific resource handler in `packages/downloader/src/generic.ts`
2. Add the necessary hostnames in `packages/downloader/src/hosts.ts`, including the user-facing reader host in `READER_HOSTS` so the extension injects its content script there

If the source doesn't have a handler yet:

1. Write a handler in `packages/downloader/src/resources/` (you can take a look at other implementations to see how it's done)
2. Follow the previous steps

### New backgrounds

To add a new background:

1. Add the image in `apps/raw-site/public/bg/`
2. Add its data in `apps/raw-site/server/routes/background.ts`

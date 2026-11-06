## Raw Downloader

This is a utility to download images from various comic-reading sites for local use.

## Running
1. Install NodeJS and pnpm (`npm i -g pnpm`)
2. `pnpm install`
3. `pnpm dev`

## Contributing

### New sources

Many comic sites share the same readers, and the way they behave is mostly the same. If you want to add a source for which an already-existing resource handler can work:

1. Assign the specific resource handler in `./utils/generic.ts`
2. Add the necessary hostnames in `./src/proxy.ts`

If the source doesn't have a handler yet:

1. Write a handler in `./src/resources/` (you can take a look at other implementations to see how it's done)
2. Follow the previous steps

### New backgrounds

To add a new background:

1. Add the image in `./public/bg/`
2. Add its data in `./server/routes/background.ts`

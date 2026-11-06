import { browser } from 'wxt/browser'
import { ContentScriptMatches } from '@raw-downloader/downloader/hosts'
import type { ResourceHandler } from '@raw-downloader/downloader'

type DownloaderModule = typeof import('@raw-downloader/downloader')

let corePromise: Promise<DownloaderModule> | undefined

function loadCore() {
  corePromise ??= import('@raw-downloader/downloader')
  return corePromise
}

type HandlerState = {
  name: string
  percentage: number
}

type JobSnapshot = {
  url: string
  states: HandlerState[]
  currentStateIndex: number
  running: boolean
  complete: boolean
  error: string
}

type PingMessage = {
  type: 'ping'
}

type StartMessage = {
  type: 'start'
  url: string
}

type DownloaderMessage = PingMessage | StartMessage

let job: JobSnapshot | undefined
let handler: ResourceHandler | undefined
let pollTimer: ReturnType<typeof setInterval> | undefined
let running = false

function cloneStates(states: HandlerState[]) {
  return states.map(state => ({ ...state }))
}

function snapshot(): JobSnapshot | undefined {
  if (!job)
    return undefined

  return {
    ...job,
    states: cloneStates(job.states)
  }
}

function syncJobFromHandler() {
  if (!job || !handler)
    return

  job.states = cloneStates(handler.states)
  job.currentStateIndex = handler.currentStateIndex
}

function broadcast() {
  const current = snapshot()
  if (!current)
    return

  browser.runtime.sendMessage({ type: 'state', job: current }).catch(() => {})
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

async function downloadZip(zip: Awaited<ReturnType<ResourceHandler['execute']>>) {
  const blob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `raw-downloader-${crypto.randomUUID()}.zip`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

async function execute(url: string) {
  if (running)
    return

  running = true
  job = {
    url,
    states: [],
    currentStateIndex: 0,
    running: true,
    complete: false,
    error: ''
  }

  try {
    const { mapUrlToHandler } = await loadCore()
    const Handler = mapUrlToHandler(url)
    handler = new Handler(url)

    syncJobFromHandler()
    broadcast()

    pollTimer = setInterval(() => {
      syncJobFromHandler()
      broadcast()
    }, 250)

    const zip = await handler.execute()

    syncJobFromHandler()
    job.running = false
    job.complete = true
    broadcast()

    await downloadZip(zip)
  } catch (e) {
    if (job) {
      job.error = e instanceof Error ? e.message : String(e)
      job.running = false
    }
  } finally {
    stopPolling()
    running = false
    broadcast()
  }
}

export default defineContentScript({
  matches: ContentScriptMatches,
  runAt: 'document_idle',
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const data = message as DownloaderMessage

      if (data?.type === 'ping') {
        sendResponse({ url: location.href, job: snapshot() })
        return
      }

      if (data?.type !== 'start' || typeof data.url !== 'string') {
        sendResponse({ error: 'Invalid request.' })
        return
      }

      let url: URL
      try {
        url = new URL(data.url)
      } catch {
        sendResponse({ error: 'Invalid URL.' })
        return
      }

      if (url.origin !== location.origin) {
        sendResponse({ error: 'The URL must be on the current tab\'s origin.' })
        return
      }

      if (running) {
        sendResponse({ started: true, job: snapshot() })
        return
      }

      sendResponse({ started: true })
      execute(url.href)
    })
  }
})

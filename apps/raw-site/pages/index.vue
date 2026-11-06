<template>
  <div class="h-[100dvh] text-white bg-black flex justify-center items-center"
    :style="background ? {
      backgroundImage: `url('${background.src}')`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    } : {}"
  >
    <div class="relative w-[min(64rem,90%)]">
      <InputBox
        v-model="url"
        class="
          w-full p-4 pr-28 rounded-full bg-neutral-600/90 backdrop-blur-lg outline-hidden
          transition-all
          hover:outline-purple-400 focus:outline-purple-300
        "
        placeholder="Input a link."
      />
      <div class="absolute right-2 top-0 flex flex-col justify-center h-14">
        <Button
          class="flex space-x-2 rounded-full px-4" @buttonClick="start"
          :class="{
            'opacity-50 pointer-events-none': !url || (handler && !complete)
          }"
        >
          <span class="my-auto">
            Go
          </span>
          <IconArrowRight class="my-auto" :size="24" />
        </Button>
      </div>
      <TransitionAutoHeight class="my-2" :modelValue="showDetails">
        <div v-if="handler" class="relative bg-neutral-800/80 text-white backdrop-blur-lg px-4 py-2 rounded-xl">
          <div class="my-4 space-y-2">
            <div v-for="state, index in handler.states" class="transition flex space-x-2 font-medium"
              :class="{
                'text-green-500': handler.currentStateIndex > index || state.percentage > 0.99,
                'text-red-500': handlerError && handler.currentStateIndex === index,
                'opacity-50': handler.currentStateIndex < index
              }"
            >
              <IconX v-if="handlerError && handler.currentStateIndex === index" :size="20" class="my-auto" />
              <svg v-else-if="state.percentage < 1" viewBox="0 0 20 20" class="w-5 h-5 animate-spin my-auto"
                :class="{
                  'opacity-0': handler.currentStateIndex !== index
                }"
              >
                <circle cx="10" cy="10" r="8" stroke="#eee" stroke-width="1" fill="none"
                  class="transition-[stroke-dashoffset]"
                  :stroke-dasharray="2 * Math.PI * 8"
                  :stroke-dashoffset="(2 * Math.PI * 8) * (1 - (state.percentage || 0.75))"
                />
              </svg>
              <IconCheck class="my-auto" v-else :size="20" />
              <div>
                {{ state.name }}
              </div>
            </div>
          </div>
          <div class="flex space-x-2 mt-4">
            <SwitchBtn class="my-auto" v-model="autoDownloadOnceComplete" />
            <span>
              Auto-download once complete
            </span>
          </div>
          <div class="grid grid-cols-[1fr_8rem_8rem] my-4 gap-2">
            <div></div>
            <Button :type="complete ? 'secondary' : 'danger'" class="rounded-md" @buttonClick="resetState">
              <div class="flex justify-center space-x-2">
                <IconX />
                <span>
                  {{ complete ? 'Close' : 'Cancel'}}
                </span>
              </div>
            </Button>
            <Button class="rounded-md"
              :class="{
                'opacity-50 pointer-events-none': !zipFile || !complete || handlerError
              }"
              @buttonClick="() => zipFile && downloadZipFile(zipFile)"
            >
              <div class="flex justify-center space-x-2">
                <IconDownload />
                <span>
                  Download
                </span>
              </div>
            </Button>
          </div>
        </div>
        <div v-if="handlerError" class="my-2 font-medium text-red-500 bg-neutral-800/80 backdrop-blur-lg px-4 py-2 rounded-xl">
          Error: {{ handlerError }}
        </div>
      </TransitionAutoHeight>
    </div>
  </div>
  <div class="fixed w-full top-0 left-0 p-4 bg-linear-to-b from-black/75 via-black/50 to-transparent">
    <div class="flex justify-between">
      <h1 class="my-auto text-xl sm:text-2xl text-white font-bold select-none">
        Raw Downloader
      </h1>
      <div class="flex sm:space-x-2 text-white">
        <Button class="rounded-full sm:rounded-md" type="secondary" @buttonClick="showCookieModal = true">
          <div class="flex space-x-2">
            <IconCookie />
            <span class="hidden sm:inline my-auto rounded-md">
              Cookies
            </span>
          </div>
        </Button>
        <Button class="rounded-full sm:rounded-md" type="secondary" @buttonClick="showCustomProxyModal = true">
          <div class="flex space-x-2">
            <IconPlug />
            <span class="hidden sm:inline my-auto rounded-md">
              Proxy
            </span>
          </div>
        </Button>
      </div>
    </div>
  </div>
  <div class="fixed w-full bottom-0 left-0 p-4">
    <div class="flex justify-between">
      <div class="my-auto">
        <a class="hover:underline flex space-x-2 transition text-white hover:text-purple-300" target="_blank" :href="background?.credit.original ?? undefined">
          <span>
            Artwork
          </span>
          <IconExternalLink class="my-auto" :size="20" />
        </a>
      </div>
      <div class="flex gap-2 text-white">
        <Button class="rounded-full sm:rounded-md" type="secondary" @buttonClick="showExtensionModal = true">
          <div class="flex space-x-2">
            <IconPuzzle />
            <span class="hidden sm:inline my-auto rounded-md">
              Extension
            </span>
          </div>
        </Button>
        <Button class="rounded-full sm:rounded-md" type="secondary" @buttonClick="showInfoModal = true">
          <div class="flex space-x-2">
            <IconInfoCircle />
            <span class="hidden sm:inline my-auto rounded-md">
              Info
            </span>
          </div>
        </Button>
      </div>
    </div>
  </div>
  <ProxyModal v-model="showCustomProxyModal" />
  <InfoModal v-model="showInfoModal" />
  <ExtensionModal v-model="showExtensionModal" />
  <CookieModal v-model="showCookieModal" />
</template>

<script setup lang="ts">
import "~/src/proxy"
import type { Background } from "~~/shared/types/background"
import type { ResourceHandler } from "@raw-downloader/downloader"
import { mapUrlToHandler } from "@raw-downloader/downloader"
import { downloadZipFile } from "~/utils/download"

import { IconX, IconArrowRight, IconDownload, IconCheck, IconPlug, IconExternalLink, IconInfoCircle, IconCookie, IconPuzzle } from "@tabler/icons-vue"
import SwitchBtn from "~/components/SwitchBtn.vue";
import JSZip from "jszip";

const showDetails = ref(false)

const url = ref('')
const handlerError = ref('')
const autoDownloadOnceComplete = ref(true)
const complete = ref(false)
const handler = ref<ResourceHandler>()
const zipFile = ref<JSZip>()

const showCustomProxyModal = ref(false)
const showInfoModal = ref(false)
const showExtensionModal = ref(false)
const showCookieModal = ref(false)

function resetState () {
  showDetails.value = false
  
  setTimeout(() => {
    handlerError.value = ''
    handler.value = undefined
    complete.value = false
    zipFile.value = undefined
    autoDownloadOnceComplete.value = true
  }, 300);
}

async function start () {
  complete.value = false
  showDetails.value = true
  handlerError.value = ''

  try {
    handler.value = new (mapUrlToHandler(url.value))(url.value)
    zipFile.value = await handler.value.execute()
  
    // In case of cancel
    if (!handler.value) return
  
    complete.value = true
    autoDownloadOnceComplete.value && downloadZipFile(zipFile.value)
  } catch (e) {
    // @ts-expect-error
    handlerError.value = e.message as string
    complete.value = true
  }
}

const { pending, data: background, error } = useAsyncData('background', async () => {
  const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'

  const resp = await fetch(`/background?orientation=${orientation}`)
  const data = await resp.json() as Background

  return data
}, { server: false })
</script>
<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-10" @close="open = false">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-neutral-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div class="max-h-[70vh] overflow-y-auto bg-neutral-800 px-4 pb-4 pt-5 sm:p-6">
                <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-50">
                  Browser extension
                </DialogTitle>

                <div class="mt-3 space-y-5 text-left text-sm text-gray-300">
                  <p>
                    The extension runs each download inside the current comic page, so it can use that site's cookies and existing browser session.
                    It is not on the Chrome Web Store or Firefox Add-ons yet, so download the ZIP for your browser, unzip it, and load it with the steps below.
                  </p>

                  <section class="space-y-2">
                    <h4 class="font-semibold text-gray-100">
                      1. Download and unzip
                    </h4>
                    <div class="grid gap-2 sm:grid-cols-2">
                      <a
                        href="/extension/raw-downloader-chrome.zip"
                        download
                        class="flex items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-purple-500"
                      >
                        <IconBrandChrome :size="18" />
                        Download for Chrome
                      </a>
                      <a
                        href="/extension/raw-downloader-firefox.zip"
                        download
                        class="flex items-center justify-center gap-2 rounded-md bg-neutral-700 px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-neutral-600"
                      >
                        <IconBrandFirefox :size="18" />
                        Download for Firefox
                      </a>
                    </div>
                    <p class="text-xs text-gray-400">
                      Unzip the downloaded file and keep the folder. You will select it in the next step.
                    </p>
                  </section>

                  <section class="space-y-2">
                    <h4 class="flex items-center gap-2 font-semibold text-gray-100">
                      <IconBrandChrome :size="18" />
                      2. Install in Chrome
                    </h4>
                    <ol class="list-decimal space-y-1 pl-5">
                      <li>
                        Open
                        <code class="rounded bg-neutral-700 px-1 py-0.5 font-mono text-xs text-purple-200">chrome://extensions</code>.
                      </li>
                      <li>
                        Enable <strong class="text-gray-100">Developer mode</strong>.
                      </li>
                      <li>
                        Click <strong class="text-gray-100">Load unpacked</strong> and select the unzipped Chrome folder (the folder containing
                        <code class="rounded bg-neutral-700 px-1 py-0.5 font-mono text-xs text-purple-200">manifest.json</code>).
                      </li>
                    </ol>
                    <p class="text-xs text-gray-400">
                      Chrome may show a warning about developer-mode extensions. This is expected until the extension is published.
                    </p>
                  </section>

                  <section class="space-y-2">
                    <h4 class="flex items-center gap-2 font-semibold text-gray-100">
                      <IconBrandFirefox :size="18" />
                      3. Install in Firefox
                    </h4>
                    <ol class="list-decimal space-y-1 pl-5">
                      <li>
                        Open
                        <code class="rounded bg-neutral-700 px-1 py-0.5 font-mono text-xs text-purple-200">about:debugging#/runtime/this-firefox</code>.
                      </li>
                      <li>
                        Click <strong class="text-gray-100">Load Temporary Add-on…</strong>.
                      </li>
                      <li>
                        Select the
                        <code class="rounded bg-neutral-700 px-1 py-0.5 font-mono text-xs text-purple-200">manifest.json</code>
                        file inside the unzipped Firefox folder.
                      </li>
                    </ol>
                    <p class="text-xs text-gray-400">
                      Firefox removes temporary add-ons when the browser restarts. Select the manifest again to reload it.
                    </p>
                  </section>

                  <section class="space-y-2">
                    <h4 class="font-semibold text-gray-100">
                      4. Use it
                    </h4>
                    <p>
                      Open a supported reader page, click the Raw Downloader toolbar icon, and start the extraction from the popup.
                      The ZIP downloads automatically when it finishes.
                    </p>
                  </section>
                </div>
              </div>

              <div class="bg-neutral-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  class="transition inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-500 sm:ml-3 sm:w-auto"
                  @click="open = false"
                >
                  Close
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { IconBrandChrome, IconBrandFirefox } from '@tabler/icons-vue'

interface Props {
  modelValue: boolean
}

interface Events {
  (e: 'update:modelValue', v: Props["modelValue"]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Events>()

watch(() => props.modelValue, (newVal) => open.value = newVal)

const open = ref(props.modelValue)
watch(open, (newVal) => emit('update:modelValue', newVal))
</script>

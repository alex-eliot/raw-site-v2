<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-10" @close="open = false">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-neutral-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div class="bg-neutral-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-50">Add cookie string</DialogTitle>
                    <div class="mt-2">
                      <p class="text-left text-sm text-gray-300">
                        You can add your own cookie string to access gated content based on your own credentials.
                      </p>
                      <div class="mt-4">
                        <input type="text" autocomplete="off" :value="cookieString" @input="e => cookieString = (e.target as HTMLInputElement).value" class="block bg-neutral-700 w-full rounded-md py-1.5 px-1.5 text-gray-100 shadow-xs placeholder:text-gray-400 transition-all focus:outline-purple-400 outline-hidden sm:text-sm sm:leading-6" placeholder="Input your cookie string here" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-neutral-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  class="transition inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-500 sm:ml-3 sm:w-auto"
                  @click="() => {
                    setCookieString(cookieString)
                    open = false
                  }"
                >
                  Update
                </button>
                <button
                  type="button"
                  class="transition mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-gray-100 shadow-xs hover:bg-neutral-700 sm:mt-0 sm:w-auto"
                  @click="() => {
                    cookieString = ''
                    open = false
                  }"
                  ref="cancelButtonRef"
                >
                  Cancel
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
import { setCookieString } from '~/src/proxy';

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

const cookieString = ref('')
</script>
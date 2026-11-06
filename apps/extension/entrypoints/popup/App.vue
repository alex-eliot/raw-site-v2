<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { browser } from 'wxt/browser'

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

type PingResponse = {
  url?: string
  job?: JobSnapshot
  error?: string
}

const url = ref('')
const tabId = ref<number>()
const connected = ref(false)
const running = ref(false)
const complete = ref(false)
const error = ref('')
const states = ref<HandlerState[]>([])
const currentStateIndex = ref(0)

const canStart = computed(() => connected.value && !!url.value && !running.value)

function applyJob(job?: JobSnapshot) {
  if (!job)
    return

  running.value = job.running
  complete.value = job.complete
  error.value = job.error
  states.value = job.states
  currentStateIndex.value = job.currentStateIndex
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

  if (!tab?.id) {
    error.value = 'No active tab found.'
    return
  }

  tabId.value = tab.id

  try {
    const response = await browser.tabs.sendMessage(tab.id, { type: 'ping' }) as PingResponse

    if (response?.error) {
      error.value = response.error
      return
    }

    connected.value = true
    url.value = response?.url ?? ''
    applyJob(response?.job)
  } catch {
    error.value = 'Open a supported comic reader page in the current tab first.'
  }
}

async function start() {
  if (!tabId.value || !url.value || running.value)
    return

  error.value = ''
  complete.value = false
  states.value = []
  currentStateIndex.value = 0
  running.value = true

  try {
    const response = await browser.tabs.sendMessage(tabId.value, {
      type: 'start',
      url: url.value
    }) as { error?: string }

    if (response?.error) {
      error.value = response.error
      running.value = false
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    running.value = false
  }
}

function onMessage(message: unknown, sender: { tab?: { id?: number } }) {
  if (sender.tab?.id !== tabId.value)
    return

  const data = message as { type?: string; job?: JobSnapshot }

  if (data?.type === 'state')
    applyJob(data.job)
}

onMounted(() => {
  browser.runtime.onMessage.addListener(onMessage)
  init()
})

onBeforeUnmount(() => {
  browser.runtime.onMessage.removeListener(onMessage)
})
</script>

<template>
  <main class="app">
    <header class="header">
      <h1>Raw Downloader</h1>
      <p>Runs on the current tab's origin.</p>
    </header>

    <label class="field">
      <span>Reader URL</span>
      <input
        v-model="url"
        type="text"
        inputmode="url"
        autocomplete="off"
        spellcheck="false"
        :disabled="running"
      />
    </label>

    <button type="button" class="start" :disabled="!canStart" @click="start">
      {{ running ? 'Extracting…' : complete ? 'Run again' : 'Start extraction' }}
    </button>

    <p class="hint">
      Uses the page's cookies and request headers. The ZIP downloads automatically when finished.
    </p>

    <ul v-if="states.length" class="states">
      <li
        v-for="(state, index) in states"
        :key="index"
        :class="{
          done: state.percentage >= 1,
          active: currentStateIndex === index && !complete
        }"
      >
        <span>{{ state.name }}</span>
        <span>{{ Math.round(state.percentage * 100) }}%</span>
      </li>
    </ul>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="complete" class="success">ZIP download started.</p>
  </main>
</template>

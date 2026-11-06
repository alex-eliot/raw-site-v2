<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    class="inline-block my-auto transition p-2 font-semibold"
    :class="{
      'bg-purple-600 hover:bg-purple-500 text-white': buttonType === 'primary',
      'bg-transparent hover:bg-neutral-800/50': buttonType === 'secondary',
      'text-red-500 hover:bg-red-800/50': buttonType === 'danger'
    }"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
type ButtonType = 'primary' | 'secondary' | 'danger'

interface Props {
  type?: ButtonType
  href?: string
}

interface Events {
  (e: 'buttonClick', v: void): void
}

const props = defineProps<Props>()
const emit = defineEmits<Events>()

const buttonType = computed(() => props.type ?? 'primary')

function handleClick (e: MouseEvent) {
  if (!props.href)
    e.preventDefault()
  emit('buttonClick')
}
</script>
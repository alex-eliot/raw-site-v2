<template>
  <input
    :value="modelValue"
    class=""
    @input="(e) => updateInput(e.target as HTMLInputElement)"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Events {
  (e: 'update:modelValue', v: Props["modelValue"]): void
}

defineProps<Props>()
const emit = defineEmits<Events>()

function updateInput(el: HTMLInputElement) {
  emit('update:modelValue', el.value)
}
</script>
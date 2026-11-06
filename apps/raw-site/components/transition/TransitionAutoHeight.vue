<template>
  <div ref="expandableContainer">
    <div class="overflow-hidden">
      <slot />
    </div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from "@vueuse/motion";

interface Props {
  modelValue: boolean;
  animateOpen?: boolean;
}

const props = defineProps<Props>();

const expandableContainer = ref<HTMLDivElement | null>(null);

const { apply } = useMotion(expandableContainer, {
  initial:
    !props.modelValue || props.animateOpen
      ? {
          display: "none",
          gridTemplateRows: "0fr 0fr",
        }
      : {
          display: "grid",
          gridTemplateRows: "1fr 0fr",
        },
  render: {
    display: "grid",
    gridTemplateRows: "0fr 0fr",
    transition: { duration: 0 },
  },
  deRender: {
    display: "none",
    gridTemplateRows: "0fr 0fr",
    transition: { duration: 0 },
  },
  show: {
    display: "grid",
    gridTemplateRows: "1fr 0fr",
    transition: { type: "tween", duration: 150 },
  },
  hide: {
    display: "grid",
    gridTemplateRows: "0fr 0fr",
    transition: { type: "tween", duration: 150 },
  },
});

async function open() {
  apply("render")?.then(() => apply("show"));
}

async function close() {
  apply("hide")?.then(() => apply("deRender"));
}

defineExpose<{
  open(): Promise<void>,
  close(): Promise<void>
}>({ open, close })

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal)
      open()
    else
      close()
  }
);

onMounted(() => {
  if (props.animateOpen && props.modelValue) {
    open()
  }
});
</script>

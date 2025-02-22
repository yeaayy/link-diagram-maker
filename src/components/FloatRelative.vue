<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue';

const prop = withDefaults(defineProps<{
  relative?: HTMLElement | null;
  fitWidth?: boolean;
}>(), {
  fitWidth: false,
});

const container = shallowRef(null as HTMLElement | null);

watchEffect(() => {
  const fitWidth = prop.fitWidth;
  if (!container.value || !prop.relative) return;

  const bbox = prop.relative.getBoundingClientRect();
  container.value.style.top = bbox.bottom + 'px';
  container.value.style.left = bbox.left + 'px';
  if (fitWidth) {
    container.value.style.width = bbox.width + 'px';
  }
  container.value.style.maxHeight = window.innerHeight - bbox.bottom + 'px';
});
</script>

<template>
  <Teleport to="body">
    <div ref="container" v-bind="$attrs">
      <slot></slot>
    </div>
  </Teleport>
</template>

<style scoped>
div {
  position: absolute;
  z-index: 99;
  background-color: var(--white);
  box-shadow: 0px 0px 0.1rem var(--black);
}
</style>

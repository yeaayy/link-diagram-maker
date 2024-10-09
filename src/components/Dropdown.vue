<script setup lang="ts">
import { provide, ref, shallowRef, watch, type ShallowRef, watchEffect } from 'vue';

const prop = defineProps<{
  relative: HTMLElement | null
}>();

const open = ref(false);
const dropdown: ShallowRef<HTMLElement | null> = shallowRef(null);

provide('close-dropdown', () => {
  open.value = false;
})

watchEffect(() => {
  if (!dropdown.value || !prop.relative) return;

  const bbox = prop.relative.getBoundingClientRect();
  dropdown.value.style.top = bbox.bottom + 'px';
  dropdown.value.style.right = window.innerWidth - bbox.right + 'px';
});

defineExpose({
  toggle() {
    open.value = !open.value;
  }
})
</script>

<template>
  <Teleport to="body" v-if="open">
    <div class="overlay" @click="open = false"></div>
    <div ref="dropdown" class="dropdown">
      <slot></slot>
    </div>
  </Teleport>
</template>

<style scoped>

.dropdown {
  position: absolute;
  right: 0px;
  z-index: 99;
  background-color: white;
  box-shadow: 0px 0px 0.5rem black;

  &>* {
    text-wrap: nowrap;
  }

  &>*:not(:first-child) {
    border-top: 1px solid gray;
  }
}

.overlay {
  position: absolute;
  z-index: 50;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
}
</style>

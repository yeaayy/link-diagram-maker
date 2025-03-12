<script setup lang="ts">
import { inject } from 'vue';

const closeDropdown = inject<() => void>('close-dropdown');
</script>

<template>
  <div @click="closeDropdown">
    <slot />
  </div>
</template>

<style scoped>
div {
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>

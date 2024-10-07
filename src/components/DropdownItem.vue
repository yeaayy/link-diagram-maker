<script setup lang="ts">
import { inject } from 'vue';

const closeDropdown = inject<() => void>('close-dropdown');
</script>

<template>
  <div @click="closeDropdown">
    <slot />
  </div>
</template>

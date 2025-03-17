<script setup lang="ts">
import { onMounted, provide } from 'vue';

const prop = defineProps<{
  default?: string;
}>();

const selected = defineModel();

provide('tab', selected);

onMounted(() => {
  if (prop.default) {
    selected.value = prop.default;
  }
});
</script>

<template>
  <slot></slot>
</template>

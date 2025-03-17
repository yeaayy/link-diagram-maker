<script setup lang="ts">
import { inject, type ModelRef } from 'vue';

const prop = defineProps<{
  name: string;
}>();

const selected = inject<ModelRef<string>>('tab');
</script>

<template>
  <slot :class="{ active: selected === name }" @click="selected = name"></slot>
</template>

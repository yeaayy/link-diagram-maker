<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue';

const prop = withDefaults(defineProps<{
  dash: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  padding?: number;
  stroke?: string;
  background?: string;
  cap?: 'butt' | 'round' | 'square' | 'inherit';
}>(), {
  width: 100,
  height: 20,
  padding: 10,
  stroke: "black",
  strokeWidth: 3,
  background: "white",
  cap: 'butt',
});

const dash = shallowRef('');

watchEffect(() => {
  dash.value = prop.dash.map(val => val * prop.strokeWidth).join(' ');
});
</script>

<template>
  <svg :width="width" :height="height" :style="{background: background}">
    <line
      :stroke-width="strokeWidth"
      :stroke-dasharray="dash"
      :stroke-linecap="cap"
      :stroke="stroke"
      :x1="padding"
      :y1="height / 2"
      :x2="width - padding"
      :y2="height / 2"
    />
  </svg>
</template>

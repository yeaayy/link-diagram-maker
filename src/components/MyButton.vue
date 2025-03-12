<script setup lang="ts">
import type { ButtonHTMLAttributes } from 'vue';

interface MyButtonAttributes extends /* @vue-ignore */ ButtonHTMLAttributes {
  color?: 'green' | 'red' | 'blue';
}

withDefaults(defineProps<MyButtonAttributes>(), {
  color: 'green',
});

</script>

<template>
  <button :class="color" v-bind="$attrs">
    <slot />
  </button>
</template>

<style scoped>
button {
  color: white;
  padding: 0.5rem;
  font-weight: bold;
  border: none;
  background: var(--button-color);

  &:disabled {
    filter: grayscale();
  }

  &:hover:not(:disabled) {
    cursor: pointer;
    background: var(--button-hover);
  }
}

button.blue {
  --button-color: #2875cd;
  --button-hover: #93c5fd;
}

button.green {
  --button-color: #059669;
  --button-hover: #10b981;
}

button.red {
  --button-color: #dd2f2f;
  --button-hover: #de5454;
}
</style>

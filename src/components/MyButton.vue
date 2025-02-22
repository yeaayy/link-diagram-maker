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
}

button.blue {
  background: #2875cd;
  &:hover {
    background: #93c5fd;
  }
}

button.green {
  background-color: #059669;
  &:hover {
    background-color: #10b981;
  }
}

button.red {
  background-color: #ff0000;
  &:hover {
    background-color: #ff0000;
  }
}
</style>

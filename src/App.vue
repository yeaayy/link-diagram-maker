<script setup lang="ts">
import { loadingKey } from '@/loading';
import { provide, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { ImageStorage, imageStorageKey } from './ImageStorage';

const router = useRouter();
const isLoading = ref(false);

function setLoading(loading = true) {
  isLoading.value = loading;
}

provide(loadingKey, setLoading);
provide(imageStorageKey, new ImageStorage(router));
</script>

<template>
  <RouterView />

  <div v-if="isLoading" class="container">
    <div class="spin"></div>
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  display: flex;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  background-color: #000000b2;
}

.spin {
  margin: auto;
  width: 2.25rem;
  height: 2.25rem;
  border: 4px solid #9ca3af;
  border-top-color: white;
  border-radius: 999px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

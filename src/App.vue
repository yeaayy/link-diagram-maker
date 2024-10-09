<script setup lang="ts">
import { confirmDialogKey, type ConfirmDialogData } from '@/confirm';
import { loadingKey } from '@/loading';
import { provide, ref, shallowRef, type ComponentInstance } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { ImageStorage, imageStorageKey } from './ImageStorage';
import ConfirmDialog from './components/ConfirmDialog.vue';

const router = useRouter();
const isLoading = ref(false);
const confirmDialog = shallowRef(null! as ComponentInstance<typeof ConfirmDialog>);
const confirmDialogData = shallowRef<ConfirmDialogData>({});

function setLoading(loading = true) {
  isLoading.value = loading;
}

function showConfirm(titleOrData: string | ConfirmDialogData) {
  if (typeof titleOrData === 'string') {
    confirmDialogData.value = {
      body: titleOrData,
    }
  } else {
    confirmDialogData.value = {
      ...titleOrData,
    };
  }
  return confirmDialog.value.show();
}

provide(loadingKey, setLoading);
provide(imageStorageKey, new ImageStorage(router));
provide(confirmDialogKey, showConfirm);
</script>

<template>
  <RouterView />

  <div v-if="isLoading" class="container">
    <div class="spin"></div>
  </div>

  <ConfirmDialog ref="confirmDialog" v-bind="confirmDialogData"></ConfirmDialog>
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

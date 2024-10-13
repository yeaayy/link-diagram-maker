<script setup lang="ts">
import { confirmDialogKey, type ConfirmDialogData } from '@/confirm';
import { loadingKey } from '@/loading';
import { provide, ref, shallowRef, type ComponentInstance } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { ImageStorage, imageStorageKey } from './ImageStorage';
import ConfirmDialog from './components/ConfirmDialog.vue';
import PromptDialog from './components/PromptDialog.vue';
import { HttpClient, httpKey } from './http';
import { promptDialogKey, type PromptDialogData } from './prompt';
import { alertDialogKey, type AlertDialogData } from './alert';
import AlertDialog from './components/AlertDialog.vue';

const router = useRouter();
const isLoading = ref(false);
const http = new HttpClient(router, showAlert);
const confirmDialog = shallowRef(null! as ComponentInstance<typeof ConfirmDialog>);
const promptDialog = shallowRef(null! as ComponentInstance<typeof PromptDialog>);
const alertDialog = shallowRef(null! as ComponentInstance<typeof AlertDialog>);
const confirmDialogData = shallowRef<ConfirmDialogData>({});
const promptDialogData = shallowRef<PromptDialogData>({});
const alertDialogData = shallowRef<AlertDialogData>({});

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

function showPrompt(titleOrData: string | PromptDialogData) {
  if (typeof titleOrData === 'string') {
    promptDialogData.value = {
      title: titleOrData,
    }
  } else {
    promptDialogData.value = {
      ...titleOrData,
    };
  }
  return promptDialog.value.show();
}

function showAlert(bodyOrData: string | AlertDialogData) {
  if (typeof bodyOrData === 'string') {
    alertDialogData.value = {
      local: true,
      body: bodyOrData,
    }
  } else {
    alertDialogData.value = {
      local: true,
      ...bodyOrData,
    };
  }
  return alertDialog.value.show();
}

router.beforeEach((to, from, next) => {
  if (alertDialogData.value.local) {
    alertDialog.value?.hide();
  }
  next();
})

provide(loadingKey, setLoading);
provide(httpKey, http);
provide(imageStorageKey, new ImageStorage(http));
provide(confirmDialogKey, showConfirm);
provide(promptDialogKey, showPrompt);
provide(alertDialogKey, showAlert);
</script>

<template>
  <RouterView />

  <ConfirmDialog ref="confirmDialog" v-bind="confirmDialogData" />
  <AlertDialog ref="alertDialog" v-bind="{
    icon: alertDialogData.icon,
    title: alertDialogData.title,
    body: alertDialogData.body,
    button: alertDialogData.button,
  }" />
  <PromptDialog ref="promptDialog" v-bind="promptDialogData" />

  <div v-if="isLoading" class="container">
    <div class="spin"></div>
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  z-index: 999;
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

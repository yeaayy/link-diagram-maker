<script setup lang="ts">
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, watchEffect } from 'vue';
import ModalDialog from './ModalDialog.vue';

const prop = withDefaults(defineProps<{
  icon?: string | object | string[] | IconDefinition,
  title?: string,
  body?: string,
  button?: string | null,
}>(), {
  title: 'Alert',
  body: '',
  button: 'OK',
});

const modalDialog = shallowRef<ComponentInstance<typeof ModalDialog> | null>(null);
const okButton = shallowRef<null | HTMLButtonElement>(null);
let pendingResolve: null | (() => void) = null;

watchEffect(() => {
  if (okButton.value) {
    okButton.value.focus();
  }
})

function resolve() {
  if (!pendingResolve) return;

  if (modalDialog.value!.isShowing()) {
    modalDialog.value!.hide();
  }
  pendingResolve();
  pendingResolve = null;
}

defineExpose({
  show() {
    modalDialog.value?.show();
    if (pendingResolve) {
      pendingResolve();
      pendingResolve = null;
    }
    return new Promise<void>(resolve => {
      pendingResolve = resolve;
    });
  },
  hide() {
    resolve();
  },
});
</script>

<template>
  <ModalDialog ref="modalDialog" @cancel="resolve()">
    <slot>
      {{ body }}
    </slot>

    <template #title>
      <FontAwesomeIcon v-if="icon" :icon="icon" />
      {{ title }}
    </template>
    <template #footer>
      <button ref="okButton" class="button" @click="resolve" v-if="button">
        <slot name="button">
          {{ button }}
        </slot>
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.button {
  border: none;
  background-color: var(--white);
  color: var(--black);

  &:hover {
    background-color: #808080;
  }
}

</style>

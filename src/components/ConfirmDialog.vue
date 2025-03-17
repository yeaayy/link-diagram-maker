<script setup lang="ts">
import keyboard from '@/utils/keyboard';
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, watchEffect, type ComponentInstance } from 'vue';
import ModalDialog from './ModalDialog.vue';

const prop = withDefaults(defineProps<{
  icon?: string | object | string[] | IconDefinition,
  title?: string,
  body?: string,
  negativeName?: string,
  positiveName?: string,
}>(), {
  body: '',
  title: '',
  negativeName: 'NO',
  positiveName: 'YES',
});

const modalDialog = shallowRef<ComponentInstance<typeof ModalDialog> | null>(null);
let pendingResolve: null | ((result: boolean) => void) = null;

watchEffect(() => {
  if (modalDialog?.value?.isShowing()) {
    keyboard.overrideAction('accept', resolvePositive);
  } else {
    keyboard.removeAction('accept', resolvePositive);
  }
})

function resolvePositive() {
  modalDialog.value!.hide();
  pendingResolve!(true);
  pendingResolve = null;
}

function resolveNegative() {
  if (!pendingResolve) return;
  if (modalDialog.value!.isShowing()) {
    modalDialog.value!.hide();
  }
  pendingResolve!(false);
  pendingResolve = null;
}

defineExpose({
  show() {
    modalDialog.value?.show();
    if (pendingResolve) {
      pendingResolve(false);
      pendingResolve = null;
    }
    return new Promise<boolean>(resolve => {
      pendingResolve = resolve;
    });
  },
  hide() {
    resolveNegative();
  },
});
</script>

<template>
  <ModalDialog ref="modalDialog" @cancel="resolveNegative">
    <slot>
      {{ body }}
    </slot>

    <template #title>
      <FontAwesomeIcon v-if="icon" :icon="icon" />
      {{ title }}
    </template>
    <template #footer>
      <button @click="resolveNegative">
        <slot name="negative">
          {{ negativeName }}
        </slot>
      </button>
      <button @click="resolvePositive">
        <slot name="positive">
          {{ positiveName }}
        </slot>
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
button {
  background-color: var(--white);
  color: var(--black);
  border: none;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>

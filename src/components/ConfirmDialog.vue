<script setup lang="ts">
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, watchEffect } from 'vue';
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
const positiveButton = shallowRef<null | HTMLButtonElement>(null);
let pendingResolve: null | ((result: boolean) => void) = null;

watchEffect(() => {
  if (positiveButton.value) {
    positiveButton.value.focus();
  }
})

function resolvePositive() {
  modalDialog.value!.hide();
  pendingResolve!(true);
  pendingResolve = null;
}

function resolveNegative() {
  if (!pendingResolve) return;
  modalDialog.value!.hide();
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
  <ModalDialog ref="modalDialog" @close="resolveNegative">
    {{ body }}

    <template #title>
      <FontAwesomeIcon v-if="icon" :icon="icon" />
      {{ title }}
    </template>
    <template #footer>
      <button class="negative" @click="resolveNegative">
        <slot name="negative">
          {{ negativeName }}
        </slot>
      </button>
      <button ref="positiveButton" class="positive" @click="resolvePositive">
        <slot name="positive">
          {{ positiveName }}
        </slot>
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
button {
  background-color: white;
  border: none;
}

.negative:hover {
  background-color: rgb(226, 152, 152);
}

.positive:hover {
  background-color: rgb(152, 178, 226);
}
</style>

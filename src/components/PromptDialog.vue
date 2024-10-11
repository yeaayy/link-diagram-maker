<script setup lang="ts">
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, shallowRef, watchEffect, type ComponentInstance, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';

const prop = withDefaults(defineProps<{
  icon?: string | object | string[] | IconDefinition,
  title?: string,
  negativeName?: string,
  positiveName?: string,
  placeholder?: string,
  default?: string,
}>(), {
  title: '',
  negativeName: 'CANCEL',
  positiveName: 'OK',
  placeholder: '',
  default: '',
});

const model = ref('');
const modalDialog = shallowRef<ComponentInstance<typeof ModalDialog> | null>(null);
const input = shallowRef<HTMLInputElement | null>(null);
let pendingResolve: null | ((result: string | null) => void) = null;

watchEffect(() => {
  model.value = prop.default;
})

watch(input, input => {
  if (input) {
    input.focus();
  }
})

function resolvePositive() {
  modalDialog.value!.hide();
  pendingResolve!(model.value);
  pendingResolve = null;
}

function resolveNegative() {
  modalDialog.value!.hide();
  pendingResolve!(null);
  pendingResolve = null;
}

defineExpose({
  show() {
    modalDialog.value?.show();
    if (pendingResolve) {
      pendingResolve(null);
      pendingResolve = null;
    }
    return new Promise<string | null>(resolve => {
      pendingResolve = resolve;
    });
  },
  hide() {
    resolveNegative();
  },
});
</script>

<template>
  <ModalDialog ref="modalDialog">
    <input type="text" ref="input" :placeholder="placeholder" v-model="model" @keydown.enter="resolvePositive">

    <template #title>
      <FontAwesomeIcon v-if="icon" :icon="icon" />
      {{ title }}
    </template>
    <template #footer>
      <div class="negative" @click="resolveNegative">
        <slot name="negative">
          {{ negativeName }}
        </slot>
      </div>
      <div class="positive" @click="resolvePositive">
        <slot name="positive">
          {{ positiveName }}
        </slot>
      </div>
    </template>
  </ModalDialog>
</template>

<style scoped>
.negative:hover {
  background-color: rgb(226, 152, 152);
  cursor: pointer;
}

.positive:hover {
  background-color: rgb(152, 178, 226);
  cursor: pointer;
}

input {
  width: 100%;
}
</style>

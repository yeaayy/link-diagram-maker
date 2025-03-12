<script setup lang="ts">
import { ref, shallowRef, watch, watchEffect } from 'vue';

const prop = withDefaults(defineProps<{
  readOnly: boolean,
}>(), {
  readOnly: false,
});

const model = defineModel<string>({ default: '' });
const tmp = ref(model.value);

const emit = defineEmits<{
  finish: [text: string];
  'update:modelValue': [text: string];
}>();

const editing = shallowRef(false);
const span = shallowRef(null! as HTMLSpanElement);
const input = shallowRef(null! as HTMLInputElement);

watch(input, input => {
  input?.focus();
})

watchEffect(() => {
  tmp.value = model.value
})

function beginEdit() {
  if (!prop.readOnly) {
    editing.value = true;
  }
}

function finishEdit() {
  editing.value = false;
  model.value = tmp.value;
  emit('finish', tmp.value);
}

function cancelEdit() {
  editing.value = false;
  tmp.value = model.value;
}
</script>

<template>
  <input
    ref="input"
    type="text"
    v-if="editing"
    v-model="tmp"
    v-bind="$attrs"
    @blur="finishEdit"
    @keydown.escape.prevent="cancelEdit"
    @keydown.enter="finishEdit" />

  <span
    ref="span"
    v-else
    :class="{
      readonly: readOnly,
    }"
    :title="readOnly ? undefined : 'Click to edit'"
    @click="beginEdit"
  >{{ tmp }}</span>
</template>

<style scoped>
span {
  display: inline-block;
  padding: 4px 3px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

span.readonly {
  cursor: default;
}
</style>

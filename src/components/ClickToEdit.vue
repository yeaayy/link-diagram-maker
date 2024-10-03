<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';

const prop = withDefaults(defineProps<{
  modelValue: string;
  readOnly: boolean,
}>(), {
  readOnly: false,
});

const emit = defineEmits<{
  finish: [text: string];
  'update:modelValue': [text: string];
}>();

const editing = shallowRef(false);
const span = shallowRef(null! as HTMLSpanElement);
const input = shallowRef(null! as HTMLInputElement);
const tmp = ref(prop.modelValue);

watch(() => prop.modelValue, value => {
  tmp.value = value;
})

watch(input, input => {
  input?.focus();
})

function beginEdit() {
  if (!prop.readOnly) {
    editing.value = true;
  }
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  tmp.value = target.value;
}

function finishEdit(e: FocusEvent) {
  const target = e.target as HTMLInputElement;
  editing.value = false;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <input v-if="editing" ref="input" type="text" :value="tmp" v-bind="$attrs" @input="onInput" @blur="finishEdit">
  <span v-else ref="span" @click="beginEdit">{{ tmp }}</span>
</template>

<style scoped>
span {
  display: inline-block;
  padding: 4px 3px;
}
</style>

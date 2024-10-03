<script setup lang="ts">
const props = defineProps<{
  modelValue?: string,
  validate?: any,
  type: string,
  name: string,
  label: string,
  required?: boolean,
}>();

const emits = defineEmits(['input', 'update:modelValue']);

function oninput(e: Event) {
  if(props.validate) props.validate.$touch();
  emits('input', e);
  emits('update:modelValue', (e.target! as HTMLInputElement).value);
}
</script>

<template>
  <label :for="name">{{ label }}:</label><br>
  <input
    @input="oninput"
    :value="modelValue"
    :type="type"
    :class="[
      'border', 'border-gray-500', 'focus:border-blue-500', 'p-1',
      validate && validate.$error ? 'is-invalid' : undefined,
    ]"
    :name="name"
    :id="name"
    autocomplete="off"
    :required="required"
  />
  <br>
  <span class="text-sm text-red-600">{{ validate ? validate.$errors[0]?.$message : '' }}</span>
</template>

<style scoped>
input {
  border: 1px solid #6b7280;
  padding: 0.25rem;
  width: 100%;

  &:focus {
    border-color: #3b82f6;
  }
}
</style>

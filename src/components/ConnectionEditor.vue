<script setup lang="ts">
import type { ConnectionView } from '@/model/ConnectionView';
import { faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef } from 'vue';
import DeleteButton from './DeleteButton.vue';

const prop = defineProps<{
  connection: ConnectionView | null;
}>();

const size = shallowRef(null! as HTMLInputElement);

function changeSize(amount: number) {
  size.value.value = (parseInt(size.value.value) + amount).toString();
  onSizeChanged();
}

function onSizeChanged() {
  prop.connection!.size = parseInt(size.value.value);
}

function onColorChanged(e: Event) {
  const target = e.target as HTMLInputElement;
  prop.connection!.color = target.value.substring(1);
}

function onDelete() {
  prop.connection!.destroy();
}
</script>

<template>
  <div v-if="connection" class="connection-editor">
    <DeleteButton @click="onDelete" />

    <div class="mt-3">
      <label for="color">Color:</label>
      <br>
      <input type="color" id="color" :value="'#' + connection.color" @change="onColorChanged" />
    </div>
    <div class="mt-3">
      <label for="size">Size:</label>
      <div class="flex">
        <input ref="size" type="number" id="size" min="0" :value="connection.size" @change="onSizeChanged" />
        <FontAwesomeIcon @click="changeSize(-1)" class="minus" :icon="faMinus"/>
        <FontAwesomeIcon @click="changeSize(1)" class="plus" :icon="faPlus"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connection-editor {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  width: 25%;
  border: 1px solid black;
  background-color: white;
  z-index: 2;
}

input[type=number] {
  width: 3rem;
  text-align: center;
}

.minus {
  margin-left: 0.25rem;
  border-right: 1px solid white;
  background-color: #4478d8;
  padding: 0.25rem 0.5rem;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
  background-color: #e6e6e6;

  &:hover {
    background-color: lightblue;
  }
}

.plus {
  background-color: #4478d8;
  padding: 0.25rem 0.5rem;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  background-color: #e6e6e6;

  &:hover {
    background-color: lightblue;
  }
}
</style>

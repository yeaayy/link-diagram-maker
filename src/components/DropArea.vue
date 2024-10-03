<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';

const area = shallowRef(null! as HTMLDivElement);

function onDragEnter(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  area.value.classList.add('highlight');
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  area.value.classList.remove('highlight');
}

function onDrop(e: DragEvent) {
  onDragLeave(e);
  console.log(e)
}

onMounted(() => {
  area.value.addEventListener('dragenter', onDragEnter);
  area.value.addEventListener('dragover', onDragEnter);
  area.value.addEventListener('dragleave', onDragLeave);
  area.value.addEventListener('drop', onDrop);
});

onBeforeUnmount(() => {
  area.value.removeEventListener('dragenter', onDragEnter);
  area.value.removeEventListener('dragover', onDragEnter);
  area.value.removeEventListener('dragleave', onDragLeave);
  area.value.removeEventListener('drop', onDrop);
});
</script>

<template>
  <div class="droparea" ref="area">
    <slot></slot>
  </div>
</template>

<style scoped>
.droparea.highlight {
  background-color: red;
}
</style>

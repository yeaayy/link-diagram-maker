<script setup lang="ts">
import { NoteView } from '@/model/NoteView';
import type { StoredImage } from '@/model/StoredImage';
import { computed, shallowRef, triggerRef, type ComponentInstance, watch, type ShallowRef } from 'vue';
import DeleteButton from './DeleteButton.vue';
import ImageSelector from './ImageSelector.vue';

const prop = defineProps<{
  note: NoteView | null;
}>();

const note = computed(() => prop.note);
const imageSelector: ShallowRef<null | ComponentInstance<typeof ImageSelector>> = shallowRef(null);

function onTextChange(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  note.value!.text = target.value;
}

function onImageSelected(img: StoredImage | null) {
  note.value!.img = img;
  triggerRef(note);
}

function onDelete() {
  note.value!.destroy();
}

defineExpose({
  openImageSelector() {
    if (imageSelector.value) {
      imageSelector.value.open()
    } else {
      const stop = watch(imageSelector, sel => {
        sel?.open();
        stop();
      });
    }
  }
})
</script>

<template>
  <div v-if="note" class="note-editor">
    <DeleteButton @click="onDelete" />

    <ImageSelector ref="imageSelector" class="row" :img="note.img" @selected="onImageSelected" />

    <div class="row">
      <label for="text">Text:</label>
      <textarea id="text" :value="note.text" @change="onTextChange"></textarea>
    </div>

  </div>
</template>

<style scoped>
.note-editor {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  width: 25%;
  border: 1px solid black;
  background-color: white;
  z-index: 2;
  overflow-y: scroll;
}

#text {
  width: 100%;
  height: 32rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
}
</style>

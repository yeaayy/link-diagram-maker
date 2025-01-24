<script setup lang="ts">
import { useImageSelector } from '@/ImageSelector';
import { imageStorageKey } from '@/ImageStorage';
import { useConfirm } from '@/confirm';
import { NoteView } from '@/model/NoteView';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { computed, inject, triggerRef } from 'vue';
import ChangeableImage from './ChangeableImage.vue';
import DeleteButton from './DeleteButton.vue';

const prop = defineProps<{
  note: NoteView;
}>();

const note = computed(() => prop.note);
const confirm = useConfirm();
const imageSelector = useImageSelector();
const imageStorage = inject(imageStorageKey)!;

function onTextChange(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  note.value.text = target.value;
}

function onSelectImage() {
  imageSelector.select().then(img => {
    note.value.img = img;
    triggerRef(note);
  }).catch(() => {});
}

function onDropImage(img: File) {
  imageStorage.upload(img).then(img => {
    note.value.img = img;
    triggerRef(note);
  });
}

function onDelete() {
  confirm({
      icon: faWarning,
      title: 'Confirm delete',
      body: 'Delete selected note?',
    }).then(result => {
      if (result) {
        note.value?.destroy();
      }
    });
}
</script>

<template>
  <div class="note-editor">
    <DeleteButton @click="onDelete" />

    <ChangeableImage class="row" :img="note.img" @select="onSelectImage" @drop="onDropImage" />

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
  border: 1px solid var(--black);
  background-color: var(--white);
  z-index: 2;
  overflow-y: scroll;
}

#text {
  width: 100%;
  height: 32rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
  background-color: var(--white);
  color: var(--black);
}
</style>

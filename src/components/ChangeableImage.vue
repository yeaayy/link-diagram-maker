<script setup lang="ts">
import type { StoredImage } from '@/model/StoredImage';
import { DropArea } from '@/utils/DropArea';
import { faPencil, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

const prop = withDefaults(defineProps<{
  img?: StoredImage | null;
}>(), {
  img: null,
});

const emit = defineEmits<{
  select: [];
  drop: [file: File, e: Event];
}>();

const root = shallowRef<null | HTMLElement>(null);
const dropArea = new DropArea('image/');
const inputFile = shallowRef(null! as HTMLInputElement);
dropArea.dropped.listen((file, e) => emit('drop', file, e));

watch(root, root => {
  if (dropArea.isAttached()) dropArea.detach();
  if (root) dropArea.attach(root);
})

function selectFile() {
  inputFile.value.click();
}

function onFileUpload(e: Event) {
  const files = inputFile.value.files
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)!;
    console.log('upload', file)
    emit('drop', file, e);
  }
}

onMounted(() => {
  inputFile.value.addEventListener('change', onFileUpload)
})

onBeforeUnmount(() => {
  inputFile.value.removeEventListener('change', onFileUpload)
})
</script>

<template>
  <div v-if="img" ref="root" v-bind="$attrs" class="img root">
    <img :src="img.fullPath" />

    <div class="overlay hover" @click="emit('select')">
      <button class="select">
        <span class="show-select">
          <FontAwesomeIcon :icon="faPencil" />
          Change Image
        </span>
        <span class="show-upload">
          <FontAwesomeIcon :icon="faUpload" />
          Upload Image
        </span>
      </button>
    </div>
  </div>

  <div v-else ref="root" class="root button" v-bind="$attrs">
    <button class="select" @click="emit('select')">
      <span class="show-select">
        <FontAwesomeIcon :icon="faPencil" />
        Select Image
      </span>
      <span class="show-upload">
        <FontAwesomeIcon :icon="faUpload" />
        Upload Image
      </span>
    </button>
    <button class="upload" @click="selectFile">
      <FontAwesomeIcon :icon="faUpload" />
    </button>
  </div>
  <input type="file" ref="inputFile" accept="image/*">
</template>

<style scoped>
button.select {
  text-align: center;
  padding: 0.5rem;
  box-shadow: none;
  width: 100%;
}

img {
  max-width: 100%;
  max-height: 100%;
  width: max-content;
  height: max-content;
  display: block;
  margin: auto;
}

.img {
  position: relative;
}

.overlay {
  position: absolute;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #00000088;
  opacity: 0;
  transition: opacity 200ms linear;
}

.img:hover > .overlay,
.img.dropping > .overlay {
  opacity: 1;
}

.overlay > .select {
  width: auto;
}

.root:not(.dropping) .show-upload,
.root.dropping .show-select,
.root.dropping .upload,
input[type=file] {
  display: none;
}

.button {
  display: flex;
}

.upload {
  width: 3rem;
}
</style>

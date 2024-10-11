<script setup lang="ts">
import { imageStorageKey } from '@/ImageStorage';
import { StoredImage } from '@/model/StoredImage';
import { DropArea } from '@/utils/DropArea';
import keyboard from '@/utils/keyboard';
import { faUpload, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { inject, onBeforeMount, onMounted, shallowRef, watch } from 'vue';
import ImageSelectorItem from './ImageSelectorItem.vue';

const root = shallowRef<null | HTMLElement>(null);
const imageStorage = inject(imageStorageKey)!;
const selecting = shallowRef(false);
const show = shallowRef(false);
const list = imageStorage.getAllRef();
const dropArea = new DropArea('image/');
let pendingResolve: null | ((img: StoredImage | null) => void)
let pendingReject: null | ((reason: any) => void);

dropArea.dropped.listen(img => {
  imageStorage.upload(img);
});

watch(root, root => {
  if (root) dropArea.attach(root);
  else dropArea.detach();
})

function onItemClick(img: StoredImage | null) {
  if (selecting.value && pendingResolve && pendingReject) {
    show.value = false;
    pendingResolve!(img);
    pendingResolve = null;
    pendingReject = null;
  }
}

function cancelSelecting() {
  show.value = false;
  if (selecting.value && pendingResolve && pendingReject) {
    pendingReject!('canceled');
    pendingResolve = null;
    pendingReject = null;
  }
}

function deleteImage(img: StoredImage) {
  imageStorage.delete(img);
}

onMounted(() => {
  keyboard.addShortcut('escape', cancelSelecting);
})

onBeforeMount(() => {
  keyboard.removeShortcut('escape', cancelSelecting);
})

defineExpose({
  open() {
    selecting.value = false;
    show.value = true;
  },
  select() {
    selecting.value = true;
    show.value = true;
    imageStorage.getAll();
    return new Promise<StoredImage | null>((resolve, reject) => {
      pendingReject = reject;
      pendingResolve = resolve;
    });
  }
})
</script>

<template>
  <Teleport v-if="show" to="body">
    <div ref="root" :class="{
      'image-selector': true,
      selecting,
    }">
      <div class="title">
        {{ selecting ? 'Select An Image' : 'All Image' }}
        <FontAwesomeIcon class="close" @click="cancelSelecting" :icon="faX" />
      </div>

      <div class="list">
        <div v-if="selecting" class="item empty" @click="onItemClick(null)">
          <div>
            <FontAwesomeIcon class="icon" :icon="faX" />
            Remove Image
          </div>
        </div>

        <ImageSelectorItem v-for="img of list" class="item" :img="img" @click="onItemClick(img)" @delete="deleteImage" />

        <div class="overlay">
          <div>
            <FontAwesomeIcon :icon="faUpload" />
            Upload Image
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.image-selector {
  position: absolute;
  z-index: 10;
  left: 0.5rem;
  top: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  background: white;
  padding: 0.5rem;
  overflow-y: scroll;
  border-radius: 0.5rem;
  box-shadow: 0px 0px 0.25rem black;
}

.title {
  font-weight: bold;
  text-align: center;
  font-size: 1.5rem;
  padding: 0.25rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid gray;
}

.close {
  float: right;
  margin-right: 0.5rem;

  &:hover {
    background-color: lightblue;
  }
}

.list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  height: 32rem;
}

.item {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 20%;
  aspect-ratio: 1;
  padding: 0.25rem;
}

.image-selector.selecting .item:hover:not(:has(.menu:hover)) {
  background-color: lightblue;
}

.item.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1rem;
  border: 1px solid grey;

  .icon {
    margin: 0px 0.5rem;
  }
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
  pointer-events: none;
  transition: opacity 200ms linear;

  &>* {
    background-color: white;
    padding: 1rem;
    font-size: 2rem;
    border-radius: 0.5rem;
  }
}

.image-selector.dropping > .list > .overlay {
  opacity: 1;
}
</style>

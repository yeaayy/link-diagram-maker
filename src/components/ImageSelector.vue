<script setup lang="ts">
import { imageStorageKey } from '@/ImageStorage';
import type { StoredImage } from '@/model/StoredImage';
import keyboard from '@/utils/keyboard';
import { faPencil, faTrash, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed, inject, onBeforeMount, onMounted, shallowRef, type ShallowRef } from 'vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const prop = withDefaults(defineProps<{
  img?: StoredImage | null;
}>(), {
  img: null,
});

const emit = defineEmits<{
  selected: [img: StoredImage | null];
}>();

const imageStorage = inject(imageStorageKey)!;
const selected = computed(() => prop.img);
const selecting = shallowRef(false);
const list = imageStorage.getAllRef();

function onItemClick(img: StoredImage | null) {
  selecting.value = false;
  emit('selected', img);
}

function onSelecting() {
  selecting.value = true;
}

function cancelSelecting() {
  selecting.value = false;
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
    selecting.value = true;
  }
})
</script>

<template>
  <template v-if="selected">
    <div v-bind="$attrs" class="img">
      <img :src="selected.fullPath" />
      <div class="overlay" @click="onSelecting">
        <button class="select">
          <FontAwesomeIcon :icon="faPencil" />
          Change Image
        </button>
      </div>
    </div>
  </template>
  <button v-else v-bind="$attrs" class="select row" @click="onSelecting">
    <FontAwesomeIcon :icon="faPencil" />
    Select Image
  </button>

  <Teleport to="body">
    <div v-if="selecting" class="image-selector">
      <div class="title">
        Select An Image
        <FontAwesomeIcon class="close" @click="cancelSelecting" :icon="faX" />
      </div>
      <div class="list">
        <div class="item empty" @click="onItemClick(null)">
          <div>
            <FontAwesomeIcon class="icon" :icon="faX" />
            Remove Image
          </div>
        </div>
        <div v-for="img of list" class="item" @click="onItemClick(img)">
          <img :src="img.fullPath">
          <Dropdown class="menu">
            <DropdownItem @click="deleteImage(img)" class="dropdown-item delete">
              <FontAwesomeIcon :icon="faTrash" />
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.select {
  text-align: center;
  padding: 0.5rem;
  box-shadow: none;
  width: 100%;
}

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

  &:hover:not(:has(.menu:hover)) {
    background-color: lightblue;
  }
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

.img:hover > .overlay {
  opacity: 1;
}

.overlay > .select {
  width: auto;
}

.menu {
  top: 0px;
  right: 0px;
}

.dropdown-item {
  padding: 0.5rem;
  cursor: pointer;

  &:hover {
    background-color: lightblue;
  }
}

.dropdown-item.delete {
  color: red;

  &:hover {
    background-color: red;
    color: white;
  }
}
</style>

<script setup lang="ts">
import type { StoredImage } from '@/model/StoredImage';
import { faEllipsisV, faTrash, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance } from 'vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';
import { useConfirm } from '@/confirm';

const prop = defineProps<{
  img: StoredImage;
}>();

const emit = defineEmits<{
  delete: [img: StoredImage]
}>();

const confirm = useConfirm();
const menu = shallowRef(null! as ComponentInstance<typeof Dropdown>);
const menuButton = shallowRef<null | ComponentInstance<typeof FontAwesomeIcon>>(null)

function openMenu(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  menu.value.toggle();
}

async function confirmDelete() {
  const confirmed = await confirm({
    icon: faWarning,
    title: 'Delete this image?',
    body: 'Note that still use this image will be replaced by no image. Continue? ',
  })
  if (confirmed) {
    emit('delete', prop.img)
  }
}
</script>

<template>
  <div>
    <img :src="img.fullPath">

    <FontAwesomeIcon ref="menuButton" class="menu" @click="openMenu" :icon="faEllipsisV" />

    <Dropdown ref="menu" :relative="menuButton?.$el">
      <DropdownItem @click="confirmDelete" class="dropdown-item delete">
        <FontAwesomeIcon :icon="faTrash" />
        Delete
      </DropdownItem>
    </Dropdown>
  </div>
</template>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
  width: max-content;
  height: max-content;
  display: block;
  margin: auto;
}

.menu {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 0.5rem;
  width: 1rem;
  aspect-ratio: 1;
  margin-left: auto;

  &:hover {
    background-color: lightblue;
  }
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

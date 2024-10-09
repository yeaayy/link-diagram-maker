<script setup lang="ts">
import { useConfirm } from '@/confirm';
import { useLoading } from '@/loading';
import { faCopy, faEllipsisV, faPencil, faTrash, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, type ShallowRef } from 'vue';
import { useRouter } from 'vue-router';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';


const router = useRouter();
const confirm = useConfirm();
const loading = useLoading();
const dropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>)
const menuButton: ShallowRef<null | ComponentInstance<typeof FontAwesomeIcon>> = shallowRef(null);
const prop = defineProps<{
  name: string,
  id: string,
}>();
const emit = defineEmits<{
  delete: [id: string],
  rename: [id: string],
  copy: [id: string],
}>();

function openMenu(e: Event) {
  e.stopPropagation();
  dropdown.value.toggle();
}

async function confirmDelete() {
  const confirmed = await confirm({
    icon: faWarning,
    title: `Confirm Deletion`,
    body: `Are you sure you want to delete "${prop.name}"?`,
  });
  if (!confirmed) return;
  emit('delete', prop.id);
}

function open() {
  router.push({
    name: 'board',
    params: {
      id: prop.id,
    },
  })
}
</script>

<template>
  <div class="item" @click="open">
    {{ name }}

    <FontAwesomeIcon ref="menuButton" @click="openMenu" class="menu" :icon="faEllipsisV" />

    <Dropdown ref="dropdown" :relative="menuButton?.$el">
      <DropdownItem>
        <FontAwesomeIcon :icon="faPencil" />
        Rename
      </DropdownItem>
      <DropdownItem @click="emit('copy', id)">
        <FontAwesomeIcon :icon="faCopy" />
        Copy
      </DropdownItem>
      <DropdownItem @click="confirmDelete">
        <FontAwesomeIcon :icon="faTrash" />
        Delete
      </DropdownItem>
    </Dropdown>
  </div>
</template>

<style scoped>
.item {
  position: relative;
  border-top: 1px solid black;
  padding-left: 0.5rem;
  display: flex;
  align-items: center;

  &:last-child {
    border-bottom: 1px solid black;
  }

  &:hover:not(:has(.menu:hover)) {
    background-color: #93c5fd;
    cursor: pointer;
  }
}

.menu {
  padding: 0.5rem;
  width: 1rem;
  aspect-ratio: 1;
  margin-left: auto;

  &:hover {
    background-color: #93c5fd;
  }
}
</style>

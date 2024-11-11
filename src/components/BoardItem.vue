<script setup lang="ts">
import { useConfirm } from '@/confirm';
import { faCopy, faEllipsisV, faPencil, faTrash, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, type ShallowRef } from 'vue';
import { useRouter } from 'vue-router';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';
import { usePrompt } from '@/prompt';


const router = useRouter();
const confirm = useConfirm();
const prompt = usePrompt();
const dropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>)
const menuButton: ShallowRef<null | ComponentInstance<typeof FontAwesomeIcon>> = shallowRef(null);
const prop = defineProps<{
  name: string,
  id: string,
}>();
const emit = defineEmits<{
  delete: [id: string],
  rename: [id: string, newName: string, oldName: string],
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

async function promptRename() {
  const newName = await prompt({
    title: 'Rename',
    icon: faPencil,
    default: prop.name,
  });
  if (!newName) return;
  emit('rename', prop.id, newName, prop.name);
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
      <DropdownItem @click="promptRename">
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
  border-top: 1px solid var(--black);
  padding-left: 0.5rem;
  display: flex;
  align-items: center;

  &:last-child {
    border-bottom: 1px solid var(--black);
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

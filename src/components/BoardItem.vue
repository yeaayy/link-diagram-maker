<script setup lang="ts">
import { useConfirm } from '@/confirm';
import { usePrompt } from '@/prompt';
import { faCopy, faEllipsisV, faEye, faPencil, faShareAlt, faTrash, faUserCircle, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, type ShallowRef } from 'vue';
import { useRouter } from 'vue-router';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const router = useRouter();
const confirm = useConfirm();
const prompt = usePrompt();
const dropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>)
const menuButton: ShallowRef<null | ComponentInstance<typeof FontAwesomeIcon>> = shallowRef(null);
const prop = withDefaults(defineProps<{
  name: string,
  id: string,
  owner?: string | null,
  writeAccess?: boolean | null,
}>(), {
  owner: null,
  writeAccess: null,
});
const emit = defineEmits<{
  delete: [id: string],
  rename: [id: string, newName: string, oldName: string],
  copy: [id: string],
  share: [id: string],
  copyLink: [id: string],
}>();

function openMenu(e: Event) {
  e.stopPropagation();
  dropdown.value.toggle();
}

async function confirmDelete() {
  const confirmed = await confirm({
    icon: faWarning,
    title: `Confirm Deletion`,
    body: `Are you sure you want to delete "${prop.name}"? This action can't be undone`,
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

function copyLink() {
  emit('copyLink', prop.id);
}

function share() {
  emit('share', prop.id);
}
</script>

<template>
  <div class="item" @click="open" :title="writeAccess === false ? `${name} (view only)` : name">
    <div>{{ name }}</div>

    <template v-if="writeAccess !== null">
      <FontAwesomeIcon class="icon" :icon="faUserCircle" />
      <div>{{ owner }}</div>
    </template>

    <FontAwesomeIcon v-if="writeAccess !== null" class="icon" :icon="writeAccess ? faPencil : faEye" />
    <FontAwesomeIcon ref="menuButton" @click="openMenu" class="icon menu" :icon="faEllipsisV" />

    <Dropdown ref="dropdown" :relative="menuButton?.$el">
      <DropdownItem @click="promptRename" v-if="writeAccess !== false">
        <FontAwesomeIcon :icon="faPencil" />
        Rename
      </DropdownItem>
      <DropdownItem @click="emit('copy', id)">
        <FontAwesomeIcon :icon="faCopy" />
        Duplicate
      </DropdownItem>
      <DropdownItem @click="confirmDelete" v-if="writeAccess === null">
        <FontAwesomeIcon :icon="faTrash" />
        Delete
      </DropdownItem>
      <DropdownItem @click="share" v-if="writeAccess === null">
        <FontAwesomeIcon :icon="faShareAlt" />
        Sharing Option
      </DropdownItem>
      <DropdownItem @click="copyLink">
        <FontAwesomeIcon :icon="faCopy" />
        Copy Link
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

  div {
    flex: 1 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &:last-child {
    border-bottom: 1px solid var(--black);
  }

  &:hover:not(:has(.menu:hover)) {
    background-color: var(--hover-color);
    cursor: pointer;
  }
}

.icon {
  padding: 0.5rem;
  width: 1rem;
  aspect-ratio: 1;

  &:first-of-type {
    margin-left: auto;
  }
}

.menu {
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>

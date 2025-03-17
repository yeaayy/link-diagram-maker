<script setup lang="ts">
import { AllShortcut, type ShortcutID } from '@/utils/Shortcut';
import useShortcutManager from '@/utils/ShortcutManager';
import keyboard from '@/utils/keyboard';
import { faCirclePlus, faPencil, faTrash, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { onBeforeUnmount, onMounted, ref, shallowRef, triggerRef, type ComponentInstance } from 'vue';
import ModalDialog from '../ModalDialog.vue';

const recordKeyDialog = shallowRef(null! as ComponentInstance<typeof ModalDialog>);
const shortcutManager = useShortcutManager();
const currentShortcut = shallowRef(shortcutManager.getAllShortcut());

const recordedKey = ref(undefined as null | undefined | string);
let targetActionId: ShortcutID | null = null;
let targetKey: string | undefined = undefined;

function updateDetectedKey(e: KeyboardEvent, key: string) {
  if (recordedKey.value === undefined) {
    return false;
  }
  e.preventDefault();

  if (recordedKey.value !== null) {
    if (key === 'escape') {
      recordKeyDialog.value.hide();
      return true;
    } else if (key === 'enter' && !shortcutManager.hasShortcut(recordedKey.value)) {
      setShortcut();
      return true;
    }
  }
  recordedKey.value = key;
  return true;
}

function setShortcut() {
  let result;
  if (targetKey) {
    result = shortcutManager.changeShortcut(recordedKey.value!, targetKey, targetActionId!);
  } else {
    result = shortcutManager.addShortcut(recordedKey.value!, targetActionId!);
  }
  if (result) {
    triggerRef(currentShortcut);
  }
  recordKeyDialog.value.hide();
}

function showUpdateShortcut(actionId: ShortcutID, key?: string) {
  targetActionId = actionId;
  targetKey = key;
  recordedKey.value = null;
  recordKeyDialog.value.show();
}

function removeShortcut(actionId: ShortcutID, key: string) {
  const result = shortcutManager.removeShortcut(key, actionId);
  if (result) {
    triggerRef(currentShortcut);
  }
}

onMounted(() => {
  keyboard.setOverrideHandler(updateDetectedKey);
});

onBeforeUnmount(() => {
  keyboard.setOverrideHandler(null);
})
</script>

<template>
  <table cellpadding="0" cellspacing="0">
    <tr>
      <th></th>
      <th colspan="2">Action</th>
      <th colspan="2">Shortcut</th>
    </tr>
    <template v-for="shortcut in AllShortcut">
      <tr v-for="key of currentShortcut[shortcut.id]">
        <td class="icon add" @click.stop="showUpdateShortcut(shortcut.id)">
          <FontAwesomeIcon :icon="faCirclePlus" />
        </td>
        <td class="name" @click.stop="showUpdateShortcut(shortcut.id)">
          {{ shortcut.name }}
        </td>

        <td class="icon edit" @click.stop="showUpdateShortcut(shortcut.id, key)">
          <FontAwesomeIcon :icon="faPencil" />
        </td>
        <td class="shortcut" @click.stop="showUpdateShortcut(shortcut.id, key)">
          <div class="key">{{ key }}</div>
        </td>
        <td class="icon delete" @click.stop="removeShortcut(shortcut.id, key)">
          <FontAwesomeIcon :icon="faTrash" />
        </td>
      </tr>

      <tr v-if="currentShortcut[shortcut.id].length === 0" @click.stop="showUpdateShortcut(shortcut.id)">
        <td class="icon add">
          <FontAwesomeIcon :icon="faCirclePlus" />
        </td>
        <td class="name" colspan="4">{{ shortcut.name }}</td>
      </tr>
    </template>
  </table>

  <ModalDialog ref="recordKeyDialog" @close="recordedKey = undefined">
    <template #title>
      {{ targetKey === undefined ? 'Add Shortcut' : 'Change Shortcut' }}
      <FontAwesomeIcon class="close" :icon="faX" @click="recordKeyDialog.hide()" />
    </template>

    <div v-if="shortcutManager.hasShortcut(recordedKey!)" class="prompt">
      This key combination is alredy been used, please choose other combination.
    </div>
    <div v-else class="prompt">
      Press the desired key combination then press enter.
    </div>
    <div v-if="recordedKey" class="detected-key">
      <span class="key">{{ recordedKey }}</span>
    </div>
  </ModalDialog>
</template>

<style scoped>
table {
  width: 100%;
  border: 0px solid var(--black);
  border-left-width: 1px;
  border-right-width: 1px;
}

th {
  text-align: left;
  border-top: 1px solid var(--black);
  color: var(--white);
  background-color: var(--black);
}

th,
td {
  border-bottom: 1px solid var(--black);
  padding: 0.25rem;
}

tr:nth-child(odd) {
  backdrop-filter: invert(0.1);
}

tr:hover {
  backdrop-filter: invert(0.2);
  cursor: pointer;
}

.name {
  white-space: nowrap;
}

.icon {
  width: 0px;
  padding: 0px 0.25rem;

  > * {
    opacity: 0.1;
  }
}

.icon:hover > *,
tr:has(>.name:hover) > .add > *,
tr:has(>.shortcut:hover) > .edit > * {
  opacity: 1;
}

.key {
  width: min-content;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-family: 'Courier New', Courier, monospace;
  border: 1px solid grey;
  border-radius: 2px;
  padding: 2px;
  line-height: 1;
  backdrop-filter: invert(0.25);
  white-space: nowrap;
}

.prompt {
  font-size: 0.75rem;
  opacity: 0.5;
  text-align: center;
}


.detected-key {
    display: flex;
    margin: 1rem 0px;
    justify-content: center;
  }

.close {
  margin-left: auto;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>

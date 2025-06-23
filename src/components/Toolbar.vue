<script setup lang="ts">
import { useImageSelector } from '@/ImageSelector';
import { useAlert } from '@/alert';
import { useHttp } from '@/http';
import type { BoardView } from '@/model/BoardView';
import type ActionHistory from '@/snapshot/ActionHistory';
import { Snapshot, type ConnectionSnapshotAction, type NoteSnapshotAction } from '@/snapshot/Snapshot';
import type { ShortcutID } from '@/utils/Shortcut';
import useShortcutManager from '@/utils/ShortcutManager';
import keyboard from '@/utils/keyboard';
import sleep from '@/utils/sleep';
import { faArrowCircleLeft, faArrowRotateLeft, faArrowRotateRight, faCirclePlus, faFile, faHand, faHome, faImage, faLeftRight, faMousePointer, faPlusCircle, faSave, faShareAlt, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { AxiosError } from 'axios';
import { inject, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import BoardAccess from './BoardAccess.vue';
import ClickToEdit from './ClickToEdit.vue';
import MyButton from './MyButton.vue';
import Settings from './Settings.vue';

type ToolType = 'hand' | 'select-note' | 'select-conn';

const prop = defineProps<{
  board: BoardView;
  editable: boolean;
  history: ActionHistory;
}>();

const emit = defineEmits<{
  home: [];
  newNote: [];
  newImageNote: [];
  toolChanged: [ToolType],
}>();

let saveTimeout: NodeJS.Timeout | null = null;
let pendingSave: Promise<void> | null
const autoSaveInterval = inject<Ref<number>>('autosave-delay')!;
const boardName = defineModel<string>('boardName', { default: '' });
const http = useHttp();
const imageSelector = useImageSelector();
const shortcutManager = useShortcutManager();
const isDirty = ref(false);
const undoName = ref(undefined as undefined | string);
const redoName = ref(undefined as undefined | string);
const router = useRouter();
const alert = useAlert();
const snapshot = new Snapshot(prop.board.id);
const showBoardAccess = ref(false);
const activeTool = ref<ToolType>('hand')!;

if (import.meta.env.DEV) {
  (window as any).snapshot = snapshot;
}

function setActiveTool(name: ToolType) {
  if (!prop.board.editable) return;
  activeTool.value = name;
  emit('toolChanged', name);
}

function activateHandTool() {
  setActiveTool('hand');
}

function activateNoteSelectionTool() {
  setActiveTool('select-note');
}

function activateConnectionSelectionTool() {
  setActiveTool('select-conn');
}

function getShortcut(name: ShortcutID) {
  const keyList = shortcutManager.getShortcut(name);
  if (keyList.length == 0) return '';
  return ` (shortcut: ${keyList.join(', ').toUpperCase()})`;
}

function renameBoard(newName: string) {
  if (newName == boardName.value) return;
  http.board.rename(prop.board.id, newName)
  .catch(e => {
      alert('Failed to rename');
      console.log(e)
    })
}

async function doSave() {
  const input = snapshot.toRaw();
  snapshot.reset()

  while (true) {
    try {
      await http.board.update(input);
      break;
    } catch(e) {
      if (e instanceof AxiosError) {
        if (e.response?.status === 401) {
          // Session expired, wait until logged in again.
        } else if (e.response?.status === 409) {
          // Fatal error data conflicting, abort saving.
          alert({
            icon: faWarning,
            title: 'Failed to save',
            body: 'Your unsaved work can\'t be saved due to internal error, please refresh this page to continue.',
          });
          break;
        } else if (e.code == AxiosError.ERR_NETWORK) {
          // Wait until network available again.
        } else {
          // Unexpected error.
          throw e;
        }
      }
      await sleep(5000);
    }
  }

  pendingSave = null;
}

function scheduleAutosave() {
  if (autoSaveInterval.value != 0) {
    cancelAutosave();
    saveTimeout = setTimeout(onSave, autoSaveInterval.value * 1000);
  }
}

function cancelAutosave() {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}

function onHistoryChanged(history: ActionHistory) {
  undoName.value = history.getUndoName();
  redoName.value = history.getRedoName();
  if (snapshot.isDirty) {
    scheduleAutosave();
  } else {
    cancelAutosave();
  }
}

function onNoteSnapshotAction(backward: NoteSnapshotAction, forward: NoteSnapshotAction) {
  snapshot.pushNoteSnapshotAction(forward);
}

function onConnectionSnapshotAction(backward: ConnectionSnapshotAction, forward: ConnectionSnapshotAction) {
  snapshot.pushConnectionSnapshotAction(forward);
}

function onStateChanged(state: boolean) {
  isDirty.value = state;
}

function onSave() {
  if (!prop.editable) return;

  if (!snapshot.isDirty) return;

  if (pendingSave) return;

  saveTimeout = null;
  pendingSave = doSave();
}

function onUndo() {
  if (undoName.value !== undefined) {
    prop.history.undo();
  }
}

function onRedo() {
  if (redoName.value !== undefined) {
    prop.history.redo();
  }
}

function gotoMyBoards() {
  if (snapshot.isDirty) {
    if (!confirm('You have unsaved work, are you sure?')) {
      return;
    }
  }
  router.push({ name: 'login' });
}

onMounted(() => {
  keyboard.overrideAction('save', onSave);
  keyboard.overrideAction('undo', onUndo);
  keyboard.overrideAction('redo', onRedo);
  keyboard.overrideAction('hand-tool', activateHandTool);
  keyboard.overrideAction('note-selection-tool', activateNoteSelectionTool);
  keyboard.overrideAction('conn-selection-tool', activateConnectionSelectionTool);
  snapshot.state.listen(onStateChanged);
  prop.board.noteSnapshotAction.listen(onNoteSnapshotAction);
  prop.board.connectionSnapshotAction.listen(onConnectionSnapshotAction);
  prop.history.changed.listen(onHistoryChanged);
  scheduleAutosave();
});

onBeforeUnmount(() => {
  keyboard.removeAction('save', onSave);
  keyboard.removeAction('undo', onUndo);
  keyboard.removeAction('redo', onRedo);
  keyboard.removeAction('hand-tool', activateHandTool);
  keyboard.removeAction('note-selection-tool', activateNoteSelectionTool);
  keyboard.removeAction('conn-selection-tool', activateConnectionSelectionTool);
  snapshot.state.remove(onStateChanged);
  prop.board.noteSnapshotAction.remove(onNoteSnapshotAction);
  prop.board.connectionSnapshotAction.remove(onConnectionSnapshotAction);
  prop.history.changed.remove(onHistoryChanged);
  cancelAutosave();
})
</script>

<template>
  <div class="toolbar">
    <div class="title">
      <FontAwesomeIcon class="icon enable" :icon="faArrowCircleLeft" @click="gotoMyBoards" title="Back to my boards" />
      <ClickToEdit max-length="255" :read-only="!prop.board.editable" v-model="boardName" @finish="renameBoard" />
      <div class="right">
        <MyButton class="sharing-option" v-if="board.fullAccess" color="blue" @click="showBoardAccess = true">
          <FontAwesomeIcon :icon="faShareAlt" />
          Sharing Option
        </MyButton>
        <Settings />
      </div>
    </div>

    <div v-if="editable" class="tools">
      
      <div :class="{'icon enable': true, selected: activeTool == 'select-note'}"
        @click="activateNoteSelectionTool" :title="'Note selection tool' + getShortcut('note-selection-tool')">
        <FontAwesomeIcon :icon="faMousePointer"/>
        <FontAwesomeIcon class="subicon" :icon="faFile"/>
      </div>
      <div :class="{'icon enable': true, selected: activeTool == 'select-conn'}"
        @click="activateConnectionSelectionTool" :title="'Connection selection tool' + getShortcut('conn-selection-tool')">
        <FontAwesomeIcon :icon="faMousePointer"/>
        <FontAwesomeIcon class="subicon" :icon="faLeftRight"/>
      </div>
      <FontAwesomeIcon :class="{'icon enable': true, selected: activeTool == 'hand'}" :icon="faHand"
        @click="activateHandTool" :title="'Hand tool' + getShortcut('hand-tool')" />

      <div class="separator"></div>

      <FontAwesomeIcon :class="{
          icon: true,
          enable: isDirty,
        }" :icon="faSave"
        @click="onSave" :title="'Save' + getShortcut('save')" />

      <FontAwesomeIcon class="icon enable" :icon="faImage" @click="imageSelector.open()" title="Open All Image" />
      <FontAwesomeIcon class="icon enable" :icon="faHome" @click="$emit('home')" :title="'Reset view' + getShortcut('reset-view')" />
      <FontAwesomeIcon class="icon enable" :icon="faPlusCircle" @click="$emit('newNote')" :title="'Add note' + getShortcut('new-note')" />
      <div class="icon enable" @click="$emit('newImageNote')" :title="'Add note with image' + getShortcut('new-image-note')">
        <FontAwesomeIcon :icon="faImage"/>
        <FontAwesomeIcon class="subicon" :icon="faCirclePlus"/>
      </div>
      <FontAwesomeIcon :class="{icon: true, enable: undoName !== undefined}" :icon="faArrowRotateLeft" @click="onUndo" :title="'Undo ' + (undoName || '') + getShortcut('undo')" />
      <FontAwesomeIcon :class="{icon: true, enable: redoName !== undefined}" :icon="faArrowRotateRight" @click="onRedo" :title="'Redo ' + (redoName || '') + getShortcut('redo')" />
    </div>

    <BoardAccess v-if="showBoardAccess" :board-id="board.id" @close="showBoardAccess = false" />
  </div>
</template>

<style scoped>
.toolbar {
  position: fixed;
  padding: 0.25rem 0.5rem;
  z-index: 1;
  background-color: var(--white);
  width: 100%;
  box-shadow: 0px 0px 0.25rem gray;
}

.icon {
  display: inline-block;
  position: relative;
  margin: 0px 0.125rem;
  padding: 0.25rem;
  color: grey;
  width: 1.25rem;
  height: 1.25rem;

  &.enable:not(.selected):hover {
    background-color: var(--hover-color);
  }

  &.enable {
    color: var(--black);
    cursor: pointer;
  }
}

div.icon {
  padding: 0px;
  width: 1.75rem;
  height: 1.75rem;

  &>:first-child {
    padding: 0.25rem;
    width: 1.25rem;
    height: 1.25rem;
  }
}

.selected {
  background-color: var(--active-color);
}

.separator {
  background-color: var(--black);
  margin: 0px 0.5rem;
  width: 1px;
  height: 1rem;
  opacity: 0.75;
}

.title {
  display: flex;
  align-items: center;
}

.tools {
  display: flex;
  align-items: center;
}

.subicon {
  position: absolute;
  font-size: 0.65em;
  background-color: var(--white);
  box-shadow: 0px 0px 2px var(--white);
  border-radius: 999px;
  bottom: 0.125rem;
  right: 0.125rem;
}

.right {
  margin-left: auto;
  display: flex;
}

.sharing-option {
  margin-right: 0.5rem;
  white-space: nowrap;
}
</style>

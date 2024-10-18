<script setup lang="ts">
import { useImageSelector } from '@/ImageSelector';
import { useAlert } from '@/alert';
import { useHttp } from '@/http';
import type { BoardView } from '@/model/BoardView';
import keyboard from '@/utils/keyboard';
import sleep from '@/utils/sleep';
import { faArrowCircleLeft, faCirclePlus, faHome, faImage, faPlusCircle, faSave, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { AxiosError } from 'axios';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ClickToEdit from './ClickToEdit.vue';

const prop = defineProps<{
  board: BoardView;
  editable: boolean;
}>();

const emit = defineEmits<{
  home: [];
  newNote: [];
  newImageNote: [];
}>();

let interval: NodeJS.Timeout
let pendingSave: Promise<void> | null
const boardName = defineModel<string>('boardName', { default: '' });
const http = useHttp();
const imageSelector = useImageSelector();
const isDirty = ref(false);
const router = useRouter();
const alert = useAlert();

function renameBoard(newName: string) {
  if (newName == boardName.value) return;
  http.board.rename(prop.board.id, newName)
  .catch(e => {
      alert('Failed to rename');
      console.log(e)
    })
}

async function doSave() {
  const snapshot = prop.board.snapshot;
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

function onStateChanged(state: boolean) {
  isDirty.value = state;
}

function onSave() {
  if (!prop.editable) return;

  if (!prop.board.snapshot.isDirty) return;

  if (pendingSave) return;
  pendingSave = doSave();
}

function gotoMyBoards() {
  if (prop.board.snapshot.isDirty) {
    if (!confirm('You have unsaved work, are you sure?')) {
      return;
    }
  }
  router.push({ name: 'my-boards' });
}

onMounted(() => {
  keyboard.addShortcut('ctrl+s', onSave);
  prop.board.snapshot.state.listen(onStateChanged);
  interval = setInterval(onSave, 60 * 1000);
});

onBeforeUnmount(() => {
  keyboard.removeShortcut('ctrl+s', onSave);
  prop.board.snapshot.state.remove(onStateChanged);
  clearInterval(interval);
})
</script>

<template>
  <div class="toolbar">
    <div class="title">
      <FontAwesomeIcon class="icon" :icon="faArrowCircleLeft" @click="gotoMyBoards" title="Back to my boards" />
      <ClickToEdit max-length="255" :read-only="!prop.board.editable" v-model="boardName" @finish="renameBoard" />
    </div>

    <div v-if="editable" class="tools">
      <FontAwesomeIcon :class="{
          icon: true,
          save: true,
          enable: isDirty,
        }" :icon="faSave"
        @click="onSave" title="Save (CTRL+S)" />

      <FontAwesomeIcon class="icon enable" :icon="faImage" @click="imageSelector.open()" title="Open All Image" />
      <FontAwesomeIcon class="icon enable" :icon="faHome" @click="$emit('home')" title="Reset view (Home)" />
      <FontAwesomeIcon class="icon enable" :icon="faPlusCircle" @click="$emit('newNote')" title="Add note (ALT+N)" />
      <div class="icon enable" @click="$emit('newImageNote')" title="Add note with image (ALT+I)">
        <FontAwesomeIcon :icon="faImage"/>
        <FontAwesomeIcon class="subicon" :icon="faCirclePlus"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  position: fixed;
  padding: 0.25rem;
  z-index: 1;
  background-color: white;
  width: 100%;
  box-shadow: 0px 0px 0.25rem gray;
}

.icon {
  display: inline-block;
  position: relative;
  font-size: 1.25rem;
  padding: 0.25rem;

  &:hover {
    background-color: lightblue;
  }
}

.save {
  color: grey;

  &:hover {
    background-color: initial;
  }

  &.enable {
    color: #416ec5;

  }
}

.title {
  display: flex;
}

.tools {
  display: flex;
  align-items: center;
}

.subicon {
  position: absolute;
  font-size: 0.65em;
  filter: invert(1);
  /* text-shadow: 0px 2px white; */
  /* box-shadow: 0px ; */
  background-color: white;
  box-shadow: 0px 0px 2px white;
  border-radius: 999px;
  bottom: 0px;
  right: 0px;
}
</style>

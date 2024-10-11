<script setup lang="ts">
import { useHttp } from '@/http';
import type { BoardView } from '@/model/BoardView';
import keyboard from '@/utils/keyboard';
import { faHome, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { AxiosError } from 'axios';
import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import ClickToEdit from './ClickToEdit.vue';

const prop = defineProps<{
  board: BoardView;
  editable: boolean;
}>();

let interval: NodeJS.Timeout
let pendingSave: Promise<void> | null
const boardName = defineModel<string>('boardName', { default: '' });
const http = useHttp();
const isDirty = ref(false);
const router = useRouter();

function renameBoard(newName: string) {
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
      console.error(e);
      if (e instanceof AxiosError) {
        if (e.response?.status === 409) {
          alert('Failed to save')
          break;
        }
      }
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
      <FontAwesomeIcon class="icon" :icon="faHome" @click="gotoMyBoards" title="Back to my boards" />
      <ClickToEdit max-length="255" :read-only="!prop.board.editable" v-model="boardName" @finish="renameBoard" />
    </div>
    <div v-if="editable">
      <FontAwesomeIcon :class="{
          icon: true,
          save: true,
          enable: isDirty,
        }" :icon="faSave"
        @click="onSave" title="Save" />
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
  font-size: 1.25rem;
  padding: 0.25rem;

  &:hover {
    background-color: lightblue;
  }
}

.save {
  color: grey;

  &.enable {
    color: #416ec5;
  }
}

.title {
  display: flex;
}
</style>

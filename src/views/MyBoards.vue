<script setup lang="ts">
import { useAlert } from '@/alert';
import BoardItem from '@/components/BoardItem.vue';
import Navbar from '@/components/Navbar.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import sleep from '@/utils/sleep';
import { faFileAlt, faPlus, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { onMounted, shallowRef, triggerRef } from 'vue';
import { useRouter } from 'vue-router';

type BoardData = {
  name: string,
  id: string,
}

const loading = useLoading();
const http = useHttp();
const router = useRouter();
const boards = shallowRef([] as BoardData[]);
const alert = useAlert();
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  loading(true);
  http.board.getAll().then(({ data }) => {
    if (data.success) {
      boards.value = data.result;
    }
  }).catch(() => {})
  .finally(() => loading(false));
}

function handleError(e: unknown, title: string) {
  alert({
      icon: faWarning,
      title,
      body: 'Check your connection and try again.',
    });
}

async function createNewBoard() {
  loading();

  try {
    const { data } = await http.board.create();
    if (data.success) {
      router.push({
        name: 'board',
        params: {
          id: data.id,
        }
      });
    }
  } catch(e) {
    handleError(e, 'Failed to create');
  }
  loading(false)
}

async function onDelete(id: string) {
  loading();
  try {
    const { data } = await http.board.delete(id);
    if (data.success) {
      boards.value = boards.value.filter(b => b.id !== id);
    }
  } catch(e) {
    handleError(e, 'Failed to delete');
  }
  loading(false);
}

async function onCopy(id: string) {
  loading();
  try {
    const { data } = await http.board.copy(id);
    if (data.success) {
      boards.value.push({
        id: data.id,
        name: data.name,
      });
      triggerRef(boards);
    }
  } catch(e) {
    handleError(e, 'Failed to copy');
  }
  loading(false);
}

async function onRename(id: string, newName: string) {
  loading();
  try {
    const { data } = await http.board.rename(id, newName);
    if (data.success) {
      for (const board of boards.value) {
        if (board.id != id) continue;
        board.name = newName;
        break;
      }
      triggerRef(boards);
    }
  } catch(e) {
    handleError(e, 'Failed to rename');
  }
  loading(false);
}

onMounted(init);
</script>

<template>
  <div class="app-content" v-title="'My Diagrams'">
    <Navbar />
    <h3>
      <FontAwesomeIcon :icon="faFileAlt" />
      MY DIAGRAMS
    </h3>
    <button @click="createNewBoard">
      <FontAwesomeIcon :icon="faPlus" />
      Create
    </button>

    <div class="row">
      <BoardItem v-for="board of boards" :key="board.id" :name="board.name" :id="board.id" @delete="onDelete" @copy="onCopy" @rename="onRename" />
    </div>
  </div>
</template>

<style scoped>
h3 {
  margin-bottom: 1rem;
}

button {
  padding: 0.25rem 1rem;
  border: 1px solid #93c5fd;
  border-radius: 9999px;
  background-color: white;

  &:hover {
    background-color: #bfdbfe;
  }
}
</style>

<script setup lang="ts">
import { useAlert } from '@/alert';
import BoardItem from '@/components/BoardItem.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import sleep from '@/utils/sleep';
import { faPlus, faWarning } from '@fortawesome/free-solid-svg-icons';
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
  <div id="my-board">
    <h3>MY DIAGRAMS</h3>
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
#my-board {
  padding: 0.75rem 1rem;
  flex: 1 1 0%;
}

@media (min-width: 640px) {
  #my-board {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 768px) {
  #my-board {
    padding-left: 6rem;
    padding-right: 6rem;
  }
}

@media (min-width: 1024px) {
  #my-board {
    padding-left: 12rem;
    padding-right: 12rem;
  }
}

h3 {
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 2rem;
  margin-bottom: 0px;
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

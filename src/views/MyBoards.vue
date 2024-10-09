<script setup lang="ts">
import BoardItem from '@/components/BoardItem.vue';
import http from '@/http';
import { useLoading } from '@/loading';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, triggerRef } from 'vue';
import { useRouter } from 'vue-router';

type BoardData = {
  name: string,
  id: string,
}

const loading = useLoading();
const router = useRouter();
const boards = shallowRef([] as BoardData[]);

loading(true);
http.get('board/all.php').then(({ data }) => {
  if (data.error) {
    router.push({ name: 'login' });
    return;
  }
  boards.value = data.result;
}).finally(() => loading(false));

function createNewBoard() {
  loading(true);

  http.post('board/create.php').then(({ data }) => {
    if (!data.error) {
      router.push({
        name: 'board',
        params: {
          id: data.id,
        }
      });
    }
  }).finally(() => loading(false));
}

async function onDelete(id: string) {
  loading();
  try {
    const { data } = await http.post('board/delete.php', { id });
    if (data.success) {
      boards.value = boards.value.filter(b => b.id !== id);
    }
  } catch(e) {}
  loading(false);
}

async function onCopy(id: string) {
  loading();
  try {
    const { data } = await http.post('board/duplicate.php', { id });
    if (data.success) {
      boards.value.push({
        id: data.id,
        name: data.name,
      });
      triggerRef(boards);
    }
  } catch(e) {}
  loading(false);
}
</script>

<template>
  <div id="my-board">
    <h3>MY BOARDS</h3>
    <button @click="createNewBoard">
      <FontAwesomeIcon :icon="faPlus" />
      Create
    </button>

    <div class="row">
      <BoardItem v-for="board of boards" :key="board.id" :name="board.name" :id="board.id" @delete="onDelete" @copy="onCopy" />
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

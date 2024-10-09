<script setup lang="ts">
import BoardItem from '@/components/BoardItem.vue';
import { useHttp } from '@/http';
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
const http = useHttp();
const router = useRouter();
const boards = shallowRef([] as BoardData[]);

loading(true);
http.board.getAll().then(({ data }) => {
  if (data.success) {
    boards.value = data.result;
  }
}).finally(() => loading(false));

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
    console.log(e);
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
    console.log(e);
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
    console.log(e);
  }
  loading(false);
}
</script>

<template>
  <div id="my-board">
    <h3>MY DIAGRAMS</h3>
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

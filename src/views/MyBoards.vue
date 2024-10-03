<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useLoading } from '@/loading';
import http from '@/http';
import { useRouter } from 'vue-router';
import { shallowRef } from 'vue';
import BoardItem from '@/components/BoardItem.vue';

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
</script>

<template>
  <div id="my-board" class="lg:px-48 md:px-24 sm:px-8 px-4 py-3 flex-1">
    <h3 class="text-2xl font-bold">MY BOARDS</h3>
    <button @click="createNewBoard" class="px-4 py-1 border border-blue-300 hover:bg-blue-200 rounded-full">
      <FontAwesomeIcon :icon="faPlus" />
      Create
    </button>

    <div class="row">
      <BoardItem v-for="board of boards" :name="board.name" :id="board.id" />
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

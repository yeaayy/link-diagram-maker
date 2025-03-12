<script setup lang="ts">
import { useAlert } from '@/alert';
import BoardAccess from '@/components/BoardAccess.vue';
import BoardItem from '@/components/BoardItem.vue';
import Navbar from '@/components/Navbar.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import copyText from '@/utils/copy-text';
import { faFileAlt, faPlus, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed, onMounted, ref, shallowRef, triggerRef } from 'vue';
import { useRouter } from 'vue-router';

type BoardData = {
  name: string,
  id: string,
  owner: string | null,
  writeAccess: boolean | null,
}

const loading = useLoading();
const http = useHttp();
const router = useRouter();
const boards = shallowRef([] as BoardData[]);
const myBoards = computed(() => boards.value.filter(board => board.owner === null));
const sharedBoards = computed(() => boards.value.filter(board => board.owner !== null));
const editAccess = ref(null as string | null);
const alert = useAlert();
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  loading(true);
  http.board.getAll().then(({ data }) => {
    if (data.success) {
      boards.value = data.result.map(board => {
        return {
          id: board.id,
          name: board.name,
          owner: board.owner,
          writeAccess: board.write_access,
        }
      });
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
      myBoards.value.push({
        id: data.id,
        name: data.name,
        owner: null,
        writeAccess: null,
      });
      triggerRef(myBoards);
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

function onCopyLink(id: string) {
  const path = router.resolve({ name: 'board', params: { id }}).fullPath;
  copyText(`${location.protocol}//${location.host}${path}`);
} 

function onShare(id: string) {
  editAccess.value = id;
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
      <BoardItem
        v-for="board of myBoards"
        :key="board.id"
        :name="board.name"
        :id="board.id"
        @delete="onDelete"
        @copy="onCopy"
        @rename="onRename"
        @copy-link="onCopyLink"
        @share="onShare"
      />
    </div>

    <template v-if="sharedBoards.length > 0">
      <h3>
        <FontAwesomeIcon :icon="faFileAlt" />
        SHARED DIAGRAMS
      </h3>
      <div class="row">
        <BoardItem
          v-for="board of sharedBoards"
          :key="board.id"
          :name="board.name"
          :id="board.id"
          :owner="board.owner"
          :write-access="board.writeAccess"
          @delete="onDelete"
          @copy="onCopy"
          @rename="onRename"
          @copy-link="onCopyLink"
        />
      </div>
    </template>

    <BoardAccess v-if="editAccess" :board-id="editAccess" @close="editAccess = null" />
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
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>

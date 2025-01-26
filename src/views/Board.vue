<script setup lang="ts">
import { imageStorageKey } from '@/ImageStorage';
import { useAlert } from '@/alert';
import BoardEditor from '@/components/BoardEditor.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { BoardView } from '@/model/BoardView';
import sleep from '@/utils/sleep';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { AxiosError } from 'axios';
import { inject, onMounted, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

const loading = useLoading();
const alert = useAlert();
const http = useHttp();
const route = useRoute();
const board = shallowRef(null as null | BoardView);
const imageStorage = inject(imageStorageKey)!;

function showNotFound() {
  alert({
    icon: faWarning,
    title: 'Diagram not found',
    body: 'Invalid url or this diagram has been deleted.',
    button: null,
  });
}

function proccessData(board: BoardView, data: any) {
  try {
    board.name = data.name;
    board.editable = data.editable;
    for (const note of data.notes) {
      board.newNote(
        parseInt(note.id),
        parseFloat(note.x),
        parseFloat(note.y),
        note.text,
        note.img ? imageStorage.getOrAdd(note.img) : null,
      );
    }
    for (const conn of data.conns) {
      board.newConnection(
        parseInt(conn.note_1),
        parseInt(conn.pos_1),
        parseInt(conn.note_2),
        parseInt(conn.pos_2),
        conn.color,
        parseInt(conn.size),
        conn.dash == '' ? [] : conn.dash.split(' ').map((val: any) => parseFloat(val)),
      );
    }
    board.snapshot.reset();
    return board;
  } catch (e) {
    alert({
      icon: faWarning,
      title: 'Load failed',
      body: 'Failed to load this diagram.',
      button: null,
    });
    console.error('Error reading data from  the server', e);
    return null;
  }
}

async function init(boardId: string) {
  loading();
  while (true) {
    try {
      const { data } = await http.board.get(boardId as string);
      board.value = proccessData(new BoardView(boardId), data);
      loading(false);
      break;
    } catch(e: unknown) {
      if (e instanceof AxiosError) {
        if (e.status == 404) {
          showNotFound();
          loading(false);
          break;
        }
      }
      await sleep(5000);
    }
  }
}

onMounted(() => {
  const boardId = route.params.id;
  if (typeof boardId !== 'string') {
    showNotFound();
  } else {
    init(boardId);
  }
});
</script>

<template>
  <BoardEditor v-if="board !== null" :board="board" />
</template>

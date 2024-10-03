<script setup lang="ts">
import { imageStorageKey } from '@/ImageStorage';
import ConnectionEditor from '@/components/ConnectionEditor.vue';
import NoteEditor from '@/components/NoteEditor.vue';
import http from '@/http';
import { BoardView } from '@/model/BoardView';
import { ConnPosition, ConnectionView } from '@/model/ConnectionView';
import { NoteView } from '@/model/NoteView';
import { DropArea } from '@/utils/DropArea';
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from '@/utils/PointerHandler';
import keyboard, { getModifier } from '@/utils/keyboard';
import { inject, onBeforeUnmount, onMounted, shallowRef, triggerRef, type ComponentInstance, type ShallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let initialized = false;
let px = 0, py = 0;
const router = useRouter();
const boardId = useRoute().params.id;
const root = shallowRef(null! as HTMLDivElement);
const svg = shallowRef(null! as SVGElement);
const selectedConnection: ShallowRef<null | ConnectionView> = shallowRef(null);
const selectedNote: ShallowRef<null | NoteView> = shallowRef(null);
const noteEditor = shallowRef(null! as ComponentInstance<typeof NoteEditor>);
const board = shallowRef(new BoardView());
const imageStorage = inject(imageStorageKey)!;
const dropArea = new DropArea('image/');
const poinerHandler = new PointerHandler({
  onmove: onPointerMove,
  onidle: onPointerIdle,
  onclick: unselect,
  stopPropagation: true,
});

// @ts-ignore
window.board = board.value;

board.value.noteCreated.listen(onNoteCreated);
board.value.connectionCreated.listen(onConnectionCreated);
dropArea.dropped.listen((file: File, e: DragEvent) => {
  imageStorage.upload(file).then((img => {
    const b = board.value;
    b.createNote(e.clientX - b.dx, e.clientY - b.dy, '', img)
  }))
})

http.get('board/get.php', {
  params: {
    id: boardId,
  }
}).then(({ data }) => {
  if (data.error) {
    router.push({ name: 'my-boards' });
    return
  }
  // board.value = data;
  console.log(data)
});

function onPointerIdle(ev: GenericPointerEvent, x: number, y: number) {
  px = x;
  py = y;
}

function onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
  board.value.dx += e.dx;
  board.value.dy += e.dy;
  triggerRef(board);
}

function onWheel(e: WheelEvent) {
  const mod = getModifier(e);
  if (mod == '' || mod == 'shift') {
    e.preventDefault();
    board.value.dx -= Math.sign(e.shiftKey ? e.deltaY : e.deltaX) * 25;
    board.value.dy -= Math.sign(e.shiftKey ? e.deltaX : e.deltaY) * 25;
    triggerRef(board);
  }
}

function onWindowResize() {
  board.value.width = root.value.clientWidth;
  board.value.height = root.value.clientHeight;
  triggerRef(board);
}

function onPressDelete() {
  if (selectedConnection.value) {
    selectedConnection.value.destroy();
  }
  if (selectedNote.value) {
    selectedNote.value.destroy();
  }
}

function unselect() {
  if (selectedConnection.value) {
    selectedConnection.value.highlight(false);
    selectedConnection.value = null;
  }
  if (selectedNote.value) {
    selectedNote.value.highlight(false);
    selectedNote.value = null;
  }
}

function createNewNote() {
  unselect();
  const b = board.value
  selectedNote.value = b.createNote(px - b.dx, py - b.dy, '');
  selectedNote.value.highlight();
}

function createNewImageNote() {
  createNewNote();
  noteEditor.value.openImageSelector();
}

function onNoteCreated(note: NoteView) {
  note.attach(root.value);
  note.clicked.listen(onNoteClicked);
  note.beforeDetached.listen(onBeforeNoteDetached);
}

function onBeforeNoteDetached(note: NoteView) {
  note.clicked.remove(onNoteClicked);
  note.beforeDetached.remove(onBeforeNoteDetached);
  if (note === selectedNote.value) {
    selectedNote.value = null;
  }
}

function onNoteClicked(note: NoteView) {
  unselect();
  selectedNote.value = note;
  note.highlight();
  triggerRef(selectedNote);
}

function onConnectionCreated(conn: ConnectionView) {
  conn.attach(svg.value);
  conn.updateView();
  conn.clicked.listen(onConnectionClicked);
  conn.beforeDetached.listen(onBeforeConnectionDetached)
}

function onBeforeConnectionDetached(conn: ConnectionView) {
  conn.clicked.remove(onConnectionClicked);
  conn.beforeDetached.remove(onBeforeConnectionDetached);
  if (conn === selectedConnection.value) {
    selectedConnection.value = null;
  }
}

function onConnectionClicked(conn: ConnectionView) {
  unselect();
  conn.highlight();
  selectedConnection.value = conn;
}

async function init() {
  const img = await imageStorage.getAll();

  board.value.newNote(1, 100, 50, 'Lorem ipsum dolor sit, amet consectetur adsomeipisicing elit. Excepturi, qui repellat! Culpa soluta repudiandae labore id adipisci in, earum corrupti.some', img[0]);
  board.value.newNote(2, 100, 250, 'Something', img[1]);
  board.value.newConnection(1, ConnPosition.bottom, 2, ConnPosition.top, 'ff0000', 5);
}

onMounted(async() => {
  if (!initialized) {
    initialized = true;
    await init();
  }
  dropArea.attach(root.value);
  poinerHandler.attach(root.value, root.value.parentElement!);
  root.value.addEventListener('wheel', onWheel);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  keyboard.addShortcut('delete', onPressDelete);
  keyboard.addShortcut('alt+n', createNewNote);
  keyboard.addShortcut('ctrl+shift+n', createNewNote);
  keyboard.addShortcut('alt+i', createNewImageNote);
});

onBeforeUnmount(() => {
  dropArea.detach();
  poinerHandler.detach();
  root.value.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onWindowResize);
  keyboard.removeShortcut('delete', onPressDelete);
  keyboard.removeShortcut('alt+n', createNewNote);
  keyboard.removeShortcut('ctrl+shift+n', createNewNote);
  keyboard.removeShortcut('alt+i', createNewImageNote);
});
</script>

<template>
  <div ref="root" class="board" :style="{
    '--shift-x': board.dx + 'px',
    '--shift-y': board.dy + 'px',
  }">
  </div>
  <svg ref="svg" :width="board.width" :height="board.height"
    :viewBox="[-board.dx, -board.dy, board.width, board.height].join(' ')">
  </svg>

  <ConnectionEditor :connection="selectedConnection"></ConnectionEditor>
  <NoteEditor ref="noteEditor" :note="selectedNote"></NoteEditor>
</template>

<style scoped>
.board {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.dropping {
  filter: invert(1);
}

svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;

}
</style>

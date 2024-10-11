<script setup lang="ts">
import { imageSelectorKey } from '@/ImageSelector';
import { imageStorageKey } from '@/ImageStorage';
import ConnectionEditor from '@/components/ConnectionEditor.vue';
import ImageSelector from '@/components/ImageSelector.vue';
import NoteEditor from '@/components/NoteEditor.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useHttp } from '@/http';
import { BoardView } from '@/model/BoardView';
import { ConnectionView } from '@/model/ConnectionView';
import { NoteView } from '@/model/NoteView';
import type { StoredImage } from '@/model/StoredImage';
import { DropArea } from '@/utils/DropArea';
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from '@/utils/PointerHandler';
import keyboard, { getModifier } from '@/utils/keyboard';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed, inject, onBeforeUnmount, onMounted, provide, shallowRef, triggerRef, type ComponentInstance, type ShallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let px = 0, py = 0;
const router = useRouter();
const http = useHttp();
const boardId = useRoute().params.id;
const root = shallowRef(null! as HTMLDivElement);
const noteContainer = shallowRef(null! as HTMLDivElement);
const svg = shallowRef(null! as SVGElement);
const previewConnection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
const selectedConnection: ShallowRef<null | ConnectionView> = shallowRef(null);
const selectedNote: ShallowRef<null | NoteView> = shallowRef(null);
const noteEditor = shallowRef(null! as ComponentInstance<typeof NoteEditor>);
const imageSelector = shallowRef(null! as ComponentInstance<typeof ImageSelector>)
const imageStorage = inject(imageStorageKey)!;
const dropArea = new DropArea('image/');
const poinerHandler = new PointerHandler({
  onmove: onPointerMove,
  onidle: onPointerIdle,
  onclick: unselect,
  stopPropagation: true,
});

provide(imageSelectorKey, {
  open() {
    imageSelector.value.open();
  },
  select() {
    return imageSelector.value.select();
  },
})

if (typeof boardId !== 'string') {
  router.push({ name: 'my-boards' });
}
const board = shallowRef(new BoardView(boardId as string));
board.value.noteCreated.listen(onNoteCreated);
board.value.connectionCreated.listen(onConnectionCreated);
board.value.previewConnection.listen(onPreviewConnection);

const scale = computed<number>({
  get() {
    return board.value.scale;
  },
  set(v) {
    board.value.scale = v;
  }
});

const boardName = computed<string>({
  get() {
    return board.value.name;
  },
  set(v)  {
    board.value.name = v
    triggerRef(board)
  }
})

dropArea.dropped.listen(onFileDropped);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.board = board.value;
}

http.board.get(boardId as string).then(({ data }) => {
  try {
    board.value.name = data.name;
    board.value.editable = data.editable;
    for (const note of data.notes) {
      const i = note.img
      board.value.newNote(parseInt(note.id), parseFloat(note.x), parseFloat(note.y), note.text, i ? imageStorage.getOrAdd(i.id, i.path, i.name) : null);
    }
    for (const conn of data.conns) {
      board.value.newConnection(parseInt(conn.note_1), parseInt(conn.pos_1), parseInt(conn.note_2), parseInt(conn.pos_2), conn.color, parseInt(conn.size));
    }
    if (!data.editable) {
      disableEditing();
    }
    triggerRef(board);
  } catch (e) {
    console.error('Error reading data from  the server', e)
  }
  board.value.snapshot.reset();
});

function isEditable() {
  return board.value.editable;
}

function onFileDropped(file: File, e: DragEvent)  {
  imageStorage.upload(file).then((img => {
    const b = board.value;
    b.createNote(e.clientX - b.dx, e.clientY - b.dy, '', img)
  }));
}

function onPointerIdle(ev: GenericPointerEvent, x: number, y: number) {
  const target = ev.target as HTMLElement;
  if (target.classList.contains('board')) {
    px = x;
    py = y;
  }
}

function onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
  board.value.dx += e.dx / scale.value;
  board.value.dy += e.dy / scale.value;
  triggerRef(board);
}

function onWheel(e: WheelEvent) {
  const mod = getModifier(e);
  if (mod == '' || mod == 'shift') {
    e.preventDefault();
    board.value.dx -= Math.sign(e.shiftKey ? e.deltaY : e.deltaX) * 25 / scale.value;
    board.value.dy -= Math.sign(e.shiftKey ? e.deltaX : e.deltaY) * 25 / scale.value;
    triggerRef(board);
  } else if (mod === 'ctrl') {
    e.preventDefault();
    const step = 0.9;
    const deltaScale = e.deltaY < 0 ? 1 / step : step;
    const oldScale = board.value.scale
    board.value.scale = oldScale * deltaScale;
    const dx = board.value.dx;
    const dy = board.value.dy;
    board.value.dx = (e.clientX  / oldScale - dx) * (1 / deltaScale - 1) + dx / deltaScale;
    board.value.dy = (e.clientY  / oldScale - dy) * (1 / deltaScale - 1) + dy / deltaScale;
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

function onPreviewConnection(from: HTMLElement, toX: number, toY: number) {
  const start = from.getBoundingClientRect();
  const scl = scale.value;
  previewConnection.setAttribute('stroke', '#' + board.value.defaultColor);
  previewConnection.setAttribute('stroke-width', board.value.defaultSize.toString());
  previewConnection.x1.baseVal.value = (start.x + start.width / 2) / scl - board.value.dx;
  previewConnection.y1.baseVal.value = (start.y + start.height / 2) / scl - board.value.dy;
  previewConnection.x2.baseVal.value = toX / scl - board.value.dx;
  previewConnection.y2.baseVal.value = toY / scl - board.value.dy;
}

function createNewNote(img: StoredImage | null = null) {
  unselect();
  const b = board.value
  selectedNote.value = b.createNote(px / b.scale - b.dx, py / b.scale - b.dy, '', img);
  selectedNote.value.highlight();
}

function createNewImageNote() {
  imageSelector.value.select()
    .then(img => createNewNote(img))
    .catch(() => {});
}

function onNoteCreated(note: NoteView) {
  note.attach(noteContainer.value);
  if (isEditable()) {
    note.clicked.listen(onNoteClicked);
    note.beforeDetached.listen(onBeforeNoteDetached);
  }
}

function onBeforeNoteDetached(note: NoteView) {
  if (!isEditable()) return;
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
  if (isEditable()) {
    conn.clicked.listen(onConnectionClicked);
    conn.beforeDetached.listen(onBeforeConnectionDetached)
  }
}

function onBeforeConnectionDetached(conn: ConnectionView) {
  if (!isEditable()) return;
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

function disableEditing() {
  dropArea.dropped.remove(onFileDropped);
  dropArea.detach();
  keyboard.removeShortcut('delete', onPressDelete);
  keyboard.removeShortcut('alt+n', createNewNote);
  keyboard.removeShortcut('ctrl+shift+n', createNewNote);
  keyboard.removeShortcut('alt+i', createNewImageNote);
}

onMounted(async() => {
  dropArea.attach(root.value);
  poinerHandler.attach(root.value, root.value.parentElement!);
  root.value.addEventListener('wheel', onWheel);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  keyboard.addShortcut('delete', onPressDelete);
  keyboard.addShortcut('alt+n', createNewNote);
  keyboard.addShortcut('ctrl+shift+n', createNewNote);
  keyboard.addShortcut('alt+i', createNewImageNote);

  svg.value.appendChild(previewConnection);
  previewConnection.classList.add('preview-connection');
});

onBeforeUnmount(() => {
  poinerHandler.detach();
  root.value.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onWindowResize);
  disableEditing();
  svg.value.removeChild(previewConnection);
});
</script>

<template>
  <Toolbar :board="board" :editable="board.editable" v-model:board-name="boardName" />

  <div ref="root" class="content">
    <div ref="noteContainer" class="board" :style="{
      '--shift-x': board.dx + 'px',
      '--shift-y': board.dy + 'px',
      '--scale': scale,
    }">
      <!-- <div style="background-color: red; width: calc(1px / var(--scale)); height: calc(1px / var(--scale)); position: absolute;"></div> -->
    </div>
    <svg id="board-svg" ref="svg" :width="board.width" :height="board.height"
      :viewBox="[-board.dx, -board.dy, board.width / scale, board.height / scale].join(' ')">
    </svg>

    <div class="overlay">
      <div>
        <FontAwesomeIcon :icon="faUpload" />
        Upload Image
      </div>
    </div>
  </div>

  <ConnectionEditor :connection="selectedConnection"></ConnectionEditor>
  <NoteEditor ref="noteEditor" :note="selectedNote"></NoteEditor>
  <ImageSelector ref="imageSelector" />
</template>

<style scoped>
.content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.board {
  width: calc(100% / var(--scale));
  height: calc(100% / var(--scale));
  transform-origin: top left;
  transform: scale(var(--scale));
  position: relative;
}

#board-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.overlay {
  display: none;
  position: absolute;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  background-color: #00000088;
  color: white;
  font-size: 3rem;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.dropping > .overlay {
  display: flex;
}
</style>

<style>
#app {
  display: flex;
  flex-direction: column;
}
</style>

<script setup lang="ts">
import { imageSelectorKey } from '@/ImageSelector';
import { imageStorageKey } from '@/ImageStorage';
import ConnectionEditor from '@/components/ConnectionEditor.vue';
import ImageSelector from '@/components/ImageSelector.vue';
import NoteEditor from '@/components/NoteEditor.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useConfirm } from '@/confirm';
import { BoardView } from '@/model/BoardView';
import { ConnectionView } from '@/model/ConnectionView';
import { NoteView } from '@/model/NoteView';
import type { StoredImage } from '@/model/StoredImage';
import { DropArea } from '@/utils/DropArea';
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from '@/utils/PointerHandler';
import keyboard, { getModifier } from '@/utils/keyboard';
import { faUpload, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { inject, onBeforeUnmount, onMounted, provide, ref, shallowReactive, shallowRef, triggerRef, type ComponentInstance, type Ref } from 'vue';

let px = 0, py = 0;
let draggedNote: null | NoteView = null;
const SENSITIVITY = 2;
const confirm = useConfirm();
const root = shallowRef(null! as HTMLDivElement);
const noteContainer = shallowRef(null! as HTMLDivElement);
const svg = shallowRef(null! as SVGElement);
const previewConnection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
const selectedConnection: Ref<ConnectionView[]> = ref([]);
const selectedNote = shallowRef([] as NoteView[]);
const noteEditor = shallowRef(null! as ComponentInstance<typeof NoteEditor>);
const imageSelector = shallowRef(null! as ComponentInstance<typeof ImageSelector>);
const imageStorage = inject(imageStorageKey)!;
const dropArea = new DropArea('image/');
const poinerHandler = new PointerHandler({
  onmove: onPointerMove,
  onidle: onPointerIdle,
  onclick: onPointerClick,
  stopPropagation: true,
});

provide(imageSelectorKey, {
  open() {
    imageSelector.value.open();
  },
  select() {
    return imageSelector.value.select();
  },
});

const prop = defineProps<{
  board: BoardView;
}>();
const board = shallowReactive(prop.board);
board.noteCreated.listen(onNoteCreated);
board.connectionCreated.listen(onConnectionCreated);
board.previewConnection.listen(onPreviewConnection);
if (import.meta.env.DEV) {
  // @ts-ignore
  window.board = board;
}

function isEditable() {
  return board.editable;
}

function onFileDropped(file: File, e: DragEvent)  {
  imageStorage.upload(file).then((img => {
    const b = board;
    b.createNote(e.clientX / b.scale - b.dx, e.clientY / b.scale - b.dy, '', img)
  }));
}

function onPointerIdle(ev: GenericPointerEvent, x: number, y: number) {
  const target = ev.target as HTMLElement;
  if (target.classList.contains('content')) {
    px = x;
    py = y;
  }
}

function onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
  board.dx += e.dx / board.scale;
  board.dy += e.dy / board.scale;
}

function onPointerClick(ev: GenericPointerEvent) {
  const target = ev.target as HTMLElement;
  if (target.classList.contains('content') && !keyboard.shiftPressed) {
    unselect();
  }
}

function onWheel(e: WheelEvent) {
  const mod = getModifier(e);
  if (mod == '' || mod == 'shift') {
    e.preventDefault();
    board.dx -= Math.sign(e.shiftKey ? e.deltaY : e.deltaX) * 25 / board.scale;
    board.dy -= Math.sign(e.shiftKey ? e.deltaX : e.deltaY) * 25 / board.scale;
  } else if (mod === 'ctrl') {
    e.preventDefault();
    const step = 0.9;
    const deltaScale = e.deltaY < 0 ? 1 / step : step;
    const oldScale = board.scale
    board.scale = oldScale * deltaScale;
    const dx = board.dx;
    const dy = board.dy;
    board.dx = (e.clientX  / oldScale - dx) * (1 / deltaScale - 1) + dx / deltaScale;
    board.dy = (e.clientY  / oldScale - dy) * (1 / deltaScale - 1) + dy / deltaScale;
  }
}

function onWindowResize() {
  board.width = root.value.clientWidth;
  board.height = root.value.clientHeight;
}

function onPressDelete() {
  if (selectedConnection.value.length > 0) {
    for (const conn of selectedConnection.value) {
      conn.destroy();
    }
    unselectConnection();
  } else if (selectedNote.value.length > 0) {
    confirm({
      icon: faWarning,
      title: 'Confirm delete',
      body: 'Delete selected note?',
    }).then(result => {
      if (!result) return;
      for (const note of selectedNote.value) {
        note.destroy();
      }
      unselectNote();
    });
  }
}

function onForceDelete() {
  for (const conn of selectedConnection.value) {
    conn.destroy();
  }
  for (const note of selectedNote.value) {
    note.destroy();
  }
  unselect();
}

function selectAllNote() {
  unselect();
  for (const note of board.notes) {
    note.highlight();
  }
  selectedNote.value.push(...board.notes);
  triggerRef(selectedNote);
}

function unselectConnection() {
  const length = selectedConnection.value.length;
  if (length === 0) return;

  for (const conn of selectedConnection.value) {
    conn.highlight(false);
  }
  selectedConnection.value.splice(0, length);
}

function unselectNote() {
  const length = selectedNote.value.length;
  if (length === 0) return;

  for (const note of selectedNote.value) {
    note.highlight(false);
  }
  selectedNote.value.splice(0, length);
  triggerRef(selectedNote);
}

function unselect() {
  unselectConnection();
  unselectNote();
}

function onPreviewConnection(from: HTMLElement, toX: number, toY: number) {
  const start = from.getBoundingClientRect();
  const scl = board.scale;
  const size = board.defaultSize;
  previewConnection.setAttribute('stroke', '#' + board.defaultColor);
  previewConnection.setAttribute('stroke-width', size.toString());
  previewConnection.setAttribute('stroke-dasharray', board.defaultDash.map(val => val * size).join(' '));
  previewConnection.x1.baseVal.value = (start.x + start.width / 2) / scl - board.dx;
  previewConnection.y1.baseVal.value = (start.y + start.height / 2) / scl - board.dy;
  previewConnection.x2.baseVal.value = toX / scl - board.dx;
  previewConnection.y2.baseVal.value = toY / scl - board.dy;
}

function resetView() {
  board.dx = 0;
  board.dy = 0;
  board.scale = 1;
}

function createNewNote(img: StoredImage | null = null) {
  unselect();
  const b = board
  const note = b.createNote(px / b.scale - b.dx, py / b.scale - b.dy, '', img);
  note.highlight();
  selectedNote.value.push(note);
  triggerRef(selectedNote);
}

function createNewImageNote() {
  imageSelector.value.select()
    .then(img => createNewNote(img))
    .catch(() => {});
}

function createNewNoteAtCenter(img: StoredImage | null = null) {
  unselect();
  const b = board
  const note = b.createNote(b.width / 2 / b.scale - b.dx, b.height / 2 / b.scale - b.dy, '', img);
  selectedNote.value.push(note);
  note.highlight();
}

function createNewImageNoteAtCenter() {
  imageSelector.value.select()
    .then(img => createNewNoteAtCenter(img))
    .catch(() => {});
}

function onNoteCreated(note: NoteView) {
  note.attach(noteContainer.value);
  if (isEditable()) {
    note.clicked.listen(onNoteClicked);
    note.beforeDetached.listen(onBeforeNoteDetached);
    note.startDrag.listen(onStartDragNote);
    note.dragging.listen(onDragNote);
  }
}

function onBeforeNoteDetached(note: NoteView) {
  if (!isEditable()) return;
  note.clicked.remove(onNoteClicked);
  note.beforeDetached.remove(onBeforeNoteDetached);
  note.startDrag.remove(onStartDragNote);
  note.dragging.remove(onDragNote);
}

function onNoteClicked(note: NoteView) {
  unselectConnection();
  if (!keyboard.shiftPressed) {
    unselectNote();
  }
  const index = selectedNote.value.indexOf(note);
  if (index === -1) {
    selectedNote.value.push(note);
    note.highlight();
  } else {
    selectedNote.value.splice(index, 1);
    note.highlight(false);
  }
  triggerRef(selectedNote);
}

function onStartDragNote(note: NoteView) {
  if (selectedNote.value.indexOf(note) === -1) {
    draggedNote = note;
  } else {
    draggedNote = null;
  }
}

function onDragNote(note: NoteView, dx: number, dy: number) {
  if (draggedNote === null) {
    moveNote(dx, dy);
  } else {
    draggedNote.move(dx, dy);
  }
}

function moveNote(dx: number, dy: number) {
  for (const note of selectedNote.value) {
    note.move(dx, dy);
  }
}

function moveNoteLeft() {
  moveNote(-SENSITIVITY, 0);
}

function moveNoteRight() {
  moveNote(SENSITIVITY, 0);
}

function moveNoteUp() {
  moveNote(0, -SENSITIVITY);
}

function moveNoteDown() {
  moveNote(0, SENSITIVITY);
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
}

function onConnectionClicked(conn: ConnectionView) {
  unselectNote();
  if (!keyboard.shiftPressed) {
    unselectConnection();
  }
  const index = selectedConnection.value.indexOf(conn);
  if (index === -1) {
    selectedConnection.value.push(conn);
    conn.highlight();
  } else {
    selectedConnection.value.splice(index, 1);
    conn.highlight(false);
  }
}

function disableEditing() {
  dropArea.dropped.remove(onFileDropped);
  dropArea.detach();
  keyboard.removeShortcut('delete', onPressDelete);
  keyboard.removeShortcut('shift+delete', onForceDelete);
  keyboard.removeShortcut('alt+n', createNewNote);
  keyboard.removeShortcut('ctrl+shift+n', createNewNote);
  keyboard.removeShortcut('alt+i', createNewImageNote);
  keyboard.removeShortcut('ctrl+a', selectAllNote);
  keyboard.removeShortcut('escape', unselect);
  keyboard.removeShortcut('arrowleft', moveNoteLeft);
  keyboard.removeShortcut('arrowright', moveNoteRight);
  keyboard.removeShortcut('arrowup', moveNoteUp);
  keyboard.removeShortcut('arrowdown', moveNoteDown);
}

function enableEditing() {
  dropArea.dropped.listen(onFileDropped);
  dropArea.attach(root.value);
  keyboard.addShortcut('delete', onPressDelete);
  keyboard.addShortcut('shift+delete', onForceDelete);
  keyboard.addShortcut('alt+n', createNewNote);
  keyboard.addShortcut('ctrl+shift+n', createNewNote);
  keyboard.addShortcut('alt+i', createNewImageNote);
  keyboard.addShortcut('ctrl+a', selectAllNote);
  keyboard.addShortcut('escape', unselect);
  keyboard.addShortcut('arrowleft', moveNoteLeft);
  keyboard.addShortcut('arrowright', moveNoteRight);
  keyboard.addShortcut('arrowup', moveNoteUp);
  keyboard.addShortcut('arrowdown', moveNoteDown);
}

onMounted(async() => {
  poinerHandler.attach(root.value, root.value.parentElement!);
  root.value.addEventListener('wheel', onWheel);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  keyboard.addShortcut('home', resetView);

  svg.value.appendChild(previewConnection);
  previewConnection.classList.add('preview-connection');
  previewConnection.setAttribute('stroke-linecap', 'round');

  if (board.editable) {
    enableEditing();
  }
  for (const note of board.notes) {
    onNoteCreated(note);
  }
  for (const conn of board.connections) {
    onConnectionCreated(conn);
  }
});

onBeforeUnmount(() => {
  poinerHandler.detach();
  root.value.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onWindowResize);
  keyboard.removeShortcut('home', resetView);
  svg.value.removeChild(previewConnection);
  if (board.editable) {
    disableEditing();
  }
});
</script>

<template>
  <Toolbar
    :board="board"
    :editable="board.editable"
    @home="resetView"
    @new-note="createNewNoteAtCenter"
    @new-image-note="createNewImageNoteAtCenter"
    v-model:board-name="board.name" />

  <div ref="root" :class="{
    content: true,
    readonly: !board.editable,
  }" v-title="board.name">

    <svg id="board-svg" ref="svg" :width="board.width" :height="board.height"
      :viewBox="[-board.dx, -board.dy, board.width / board.scale, board.height / board.scale].join(' ')">
    </svg>

    <div ref="noteContainer" class="board" :style="{
      '--shift-x': board.dx + 'px',
      '--shift-y': board.dy + 'px',
      '--scale': board.scale,
    }">
    </div>

    <div class="overlay">
      <div>
        <FontAwesomeIcon :icon="faUpload" />
        Upload Image
      </div>
    </div>
  </div>

  <ConnectionEditor v-if="selectedConnection.length > 0" :connection="selectedConnection" :delete="onPressDelete"></ConnectionEditor>
  <NoteEditor ref="noteEditor" v-if="selectedNote.length === 1" :note="selectedNote[0]"></NoteEditor>
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
  pointer-events: none;

  & * {
    pointer-events: initial;
  }
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

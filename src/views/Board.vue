<script setup lang="ts">
import { imageSelectorKey } from '@/ImageSelector';
import { imageStorageKey } from '@/ImageStorage';
import { useAlert } from '@/alert';
import ConnectionEditor from '@/components/ConnectionEditor.vue';
import ImageSelector from '@/components/ImageSelector.vue';
import NoteEditor from '@/components/NoteEditor.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useConfirm } from '@/confirm';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { BoardView } from '@/model/BoardView';
import { ConnectionView } from '@/model/ConnectionView';
import { NoteView } from '@/model/NoteView';
import type { StoredImage } from '@/model/StoredImage';
import { DropArea } from '@/utils/DropArea';
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from '@/utils/PointerHandler';
import keyboard, { getModifier } from '@/utils/keyboard';
import sleep from '@/utils/sleep';
import { faUpload, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { AxiosError } from 'axios';
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, shallowRef, triggerRef, type ComponentInstance, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let px = 0, py = 0;
let draggedNote: null | NoteView = null;
let initialized = false;
const SENSITIVITY = 2;
const router = useRouter();
const loading = useLoading();
const alert = useAlert();
const confirm = useConfirm();
const http = useHttp();
const boardId = useRoute().params.id;
const root = shallowRef(null! as HTMLDivElement);
const noteContainer = shallowRef(null! as HTMLDivElement);
const svg = shallowRef(null! as SVGElement);
const previewConnection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
const selectedConnection: Ref<ConnectionView[]> = ref([]);
const selectedNote = shallowRef([] as NoteView[]);
const noteEditor = shallowRef(null! as ComponentInstance<typeof NoteEditor>);
const imageSelector = shallowRef(null! as ComponentInstance<typeof ImageSelector>)
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

if (import.meta.env.DEV) {
  // @ts-ignore
  window.board = board.value;
}

function proccessData(data: any) {
  try {
    board.value.name = data.name;
    board.value.editable = data.editable;
    for (const note of data.notes) {
      board.value.newNote(
        parseInt(note.id),
        parseFloat(note.x),
        parseFloat(note.y),
        note.text,
        note.img ? imageStorage.getOrAdd(note.img) : null
      );
    }
    for (const conn of data.conns) {
      board.value.newConnection(
        parseInt(conn.note_1),
        parseInt(conn.pos_1),
        parseInt(conn.note_2),
        parseInt(conn.pos_2),
        conn.color,
        parseInt(conn.size),
        conn.dash == '' ? [] : conn.dash.split(' ').map((val: any) => parseFloat(val)),
      );
    }
    if (!data.editable) {
      disableEditing();
    }
    triggerRef(board);
  } catch (e) {
    alert({
      icon: faWarning,
      title: 'Load failed',
      body: 'Failed to load this diagram.',
      button: null,
    });
    console.error('Error reading data from  the server', e)
  }
  board.value.snapshot.reset();
}

async function init() {
  if (initialized) return;
  initialized = true;

  loading();
  while (true) {
    try {
      const { data } = await http.board.get(boardId as string);
      proccessData(data);
      loading(false);
      break;
    } catch(e: unknown) {
      if (e instanceof AxiosError) {
        if (e.status == 404) {
          alert({
            icon: faWarning,
            title: 'Diagram not found',
            body: 'Invalid url or this diagram has been deleted.',
            button: null,
          })
          loading(false);
          disableEditing();
          break;
        }
      }
      await sleep(5000);
    }
  }
}

function isEditable() {
  return board.value.editable;
}

function onFileDropped(file: File, e: DragEvent)  {
  imageStorage.upload(file).then((img => {
    const b = board.value;
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
  board.value.dx += e.dx / scale.value;
  board.value.dy += e.dy / scale.value;
  triggerRef(board);
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
  for (const note of board.value.notes) {
    note.highlight();
  }
  selectedNote.value.push(...board.value.notes);
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
  const scl = scale.value;
  const size = board.value.defaultSize;
  previewConnection.setAttribute('stroke', '#' + board.value.defaultColor);
  previewConnection.setAttribute('stroke-width', size.toString());
  previewConnection.setAttribute('stroke-dasharray', board.value.defaultDash.map(val => val * size).join(' '));
  previewConnection.x1.baseVal.value = (start.x + start.width / 2) / scl - board.value.dx;
  previewConnection.y1.baseVal.value = (start.y + start.height / 2) / scl - board.value.dy;
  previewConnection.x2.baseVal.value = toX / scl - board.value.dx;
  previewConnection.y2.baseVal.value = toY / scl - board.value.dy;
}

function resetView() {
  board.value.dx = 0;
  board.value.dy = 0;
  board.value.scale = 1;
  triggerRef(board);
}

function createNewNote(img: StoredImage | null = null) {
  unselect();
  const b = board.value
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
  const b = board.value
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
}

onMounted(async() => {
  init();
  poinerHandler.attach(root.value, root.value.parentElement!);
  root.value.addEventListener('wheel', onWheel);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  keyboard.addShortcut('home', resetView);
  enableEditing();

  svg.value.appendChild(previewConnection);
  previewConnection.classList.add('preview-connection');
  previewConnection.setAttribute('stroke-linecap', 'round');
});

onBeforeUnmount(() => {
  poinerHandler.detach();
  root.value.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onWindowResize);
  if (board.value.editable) {
    disableEditing();
  }
  keyboard.removeShortcut('home', resetView);
  svg.value.removeChild(previewConnection);
});
</script>

<template>
  <Toolbar
    :board="board"
    :editable="board.editable"
    @home="resetView"
    @new-note="createNewNoteAtCenter"
    @new-image-note="createNewImageNoteAtCenter"
    v-model:board-name="boardName" />

  <div ref="root" :class="{
    content: true,
    readonly: !board.editable,
  }" v-title="boardName">

    <svg id="board-svg" ref="svg" :width="board.width" :height="board.height"
      :viewBox="[-board.dx, -board.dy, board.width / scale, board.height / scale].join(' ')">
    </svg>

    <div ref="noteContainer" class="board" :style="{
      '--shift-x': board.dx + 'px',
      '--shift-y': board.dy + 'px',
      '--scale': scale,
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

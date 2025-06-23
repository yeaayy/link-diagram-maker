<script setup lang="ts">
import { imageSelectorKey } from '@/ImageSelector';
import { imageStorageKey } from '@/ImageStorage';
import ConnectionEditor from '@/components/ConnectionEditor.vue';
import ImageSelector from '@/components/ImageSelector.vue';
import NoteEditor from '@/components/NoteEditor.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useConfirm } from '@/confirm';
import RectMinMax from '@/math/RectMinMax';
import { BoardView } from '@/model/BoardView';
import { ConnectionView } from '@/model/ConnectionView';
import { NoteView } from '@/model/NoteView';
import type { StoredImage } from '@/model/StoredImage';
import ActionHistory from '@/snapshot/ActionHistory';
import { Snapshot, type ConnectionSnapshotAction, type NoteSnapshotAction } from '@/snapshot/Snapshot';
import ConnectionSelectionTool from '@/tools/ConnectionSelectionTool';
import HandTool from '@/tools/HandTool';
import NoteSelectionTool from '@/tools/NoteSelectionTool';
import type Tool from '@/tools/Tool';
import { DropArea } from '@/utils/DropArea';
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from '@/utils/PointerHandler';
import TriggerOnce from '@/utils/TriggerOnce';
import keyboard, { getModifier } from '@/utils/keyboard';
import { faUpload, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { inject, onBeforeUnmount, onMounted, provide, ref, shallowReactive, shallowRef, triggerRef, watch, type ComponentInstance, type Ref } from 'vue';

let px = 0, py = 0;
let draggedNote: null | NoteView = null;
let activeTool: Tool = null!;

const SENSITIVITY           = 5;
const confirm               = useConfirm();
const root                  = shallowRef<HTMLDivElement>(null!);
const noteContainer         = shallowRef<HTMLDivElement>(null!);
const svg                   = shallowRef<SVGElement>(null!);
const selectedConnection    = shallowRef<ConnectionView[]>([]);
const selectedNote          = shallowRef<NoteView[]>([]);
const imageSelector         = shallowRef<ComponentInstance<typeof ImageSelector>>(null!);
const previewConnection     = document.createElementNS('http://www.w3.org/2000/svg', 'line');
const dropArea              = new DropArea('image/');
const fixSelection          = new TriggerOnce(onFixSelection);
const imageStorage          = inject(imageStorageKey)!;
const undoLimit             = inject<Ref<number>>('undo-limit')!;

const selectArea = ref<null | RectMinMax>(null);
const poinerHandler = new PointerHandler({
  onstart: onPointerStart,
  onmove: onPointerMove,
  onend: onPointerEnd,
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
const history = new ActionHistory(undoLimit.value, {
  apply(snapshot) {
    board.applySnapshot(imageStorage, snapshot);
  },
}, () => new Snapshot(board.id));

const tools = {
  'select-note': new NoteSelectionTool(board, selectArea, selectedNote, unselectNote, unselectConnection),
  'select-conn': new ConnectionSelectionTool(board, selectArea, selectedConnection, unselectNote, unselectConnection),
  'hand': new HandTool(board),
};
setActiveTool('hand');

watch(undoLimit, undoLimit => {
  history.limit = undoLimit;
});

if (import.meta.env.DEV) {
  (window as any).board = board;
  (window as any).actionHistory = history;
}

function setActiveTool(name: keyof typeof tools) {
  activeTool = tools[name];
}

function onNoteSnapshotAction(backward: NoteSnapshotAction, forward: NoteSnapshotAction) {
  history.addNoteSnapshotAction(backward, forward);
}

function onconnectionSnapshotAction(backward: ConnectionSnapshotAction, forward: ConnectionSnapshotAction) {
  history.addConnectionSnapshotAction(backward, forward);
}

function isEditable() {
  return board.editable;
}

function onFileDropped(file: File, e: DragEvent)  {
  imageStorage.upload(file).then((img => {
    const b = board;
    b.createNote(e.clientX / b.scale - b.dx, e.clientY / b.scale - b.dy, 256, '', img)
  }));
}

function onPointerStart(ev: GenericPointerEvent, px: number, py: number) {
  activeTool.onPointerStart(ev, px, py);
}

function onPointerIdle(ev: GenericPointerEvent, x: number, y: number) {
  const target = ev.target as HTMLElement;
  if (target.classList.contains('content')) {
    px = x;
    py = y;
  }
}

function onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
  activeTool.onPointerMove(ev, e);
}

function onPointerEnd(ev: GenericPointerEvent, px: number, py: number) {
  activeTool.onPointerEnd(ev, px, py);
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
  const width = root.value.clientWidth;
  const height = root.value.clientHeight;
  if (board.width === 0 && board.height === 0) {
    board.dx = width / 2;
    board.dy = height / 2;
  } else {
    board.dx += (width - board.width) / board.scale / 2;
    board.dy += (height - board.height) / board.scale / 2;
  }
  board.width = width;
  board.height = height;
}

function onPressDelete() {
  if (selectedConnection.value.length > 0) {
    history.begin('delete connection');
    for (const conn of selectedConnection.value) {
      conn.destroy();
    }
    unselectConnection();
    history.end();
  } else if (selectedNote.value.length > 0) {
    confirm({
      icon: faWarning,
      title: 'Confirm delete',
      body: 'Delete selected note?',
    }).then(result => {
      if (!result) return;
      history.begin('delete note');
      for (const note of selectedNote.value) {
        note.destroy();
      }
      history.end();
      unselectNote();
    });
  }
}

function onForceDelete() {
  if (selectedConnection.value.length > 0) {
    history.begin('delete connection');
    for (const conn of selectedConnection.value) {
      conn.destroy();
    }
  }
  if (selectedNote.value.length > 0) {
    history.begin('delete note');
    for (const note of selectedNote.value) {
      note.destroy();
    }
  }
  unselect();
  history.end();
}

function selectAllNote() {
  unselect();
  for (const note of board.notes) {
    note.highlight();
  }
  selectedNote.value.push(...board.notes);
  triggerRef(selectedNote);
}

function selectAllConnection() {
  unselect();
  for (const conn of board.connections) {
    conn.highlight();
  }
  selectedConnection.value.push(...board.connections);
  triggerRef(selectedConnection);
}

function selectMatchingConnection(matchColor: boolean, matchSize: boolean, matchDash: boolean) {
  const matching = ConnectionView.getMatchingStyle(selectedConnection.value);
  if (!matching) return;
  if (matchColor && matching.color === undefined) return;
  if (matchSize && matching.size === undefined) return;
  if (matchDash && matching.dash === undefined) return;
  for (const conn of board.connections) {
    if (selectedConnection.value.indexOf(conn) !== -1) continue;
    let match = true;
    if (matchColor) match &&= conn.color == matching.color;
    if (matchSize) match &&= conn.size == matching.size;
    if (matchDash) match &&= ConnectionView.isDashEqual(conn.dash, matching.dash!);
    if (match) {
      conn.highlight();
      selectedConnection.value.push(conn);
    }
  }
  triggerRef(selectedConnection);
}

function selectLikeConnection() {
  selectMatchingConnection(true, true, true);
}

function selectLikeConnectionColor() {
  selectMatchingConnection(true, false, false);
}

function selectLikeConnectionSize() {
  selectMatchingConnection(false, true, false);
}

function selectLikeConnectionDash() {
  selectMatchingConnection(false, false, true);
}

function unselectConnection(update = true) {
  const length = selectedConnection.value.length;
  if (length === 0) return;

  for (const conn of selectedConnection.value) {
    conn.highlight(false);
  }
  selectedConnection.value.splice(0, length);
  if (update) {
    triggerRef(selectedConnection);
  }
}

function unselectNote(update = true) {
  const length = selectedNote.value.length;
  if (length === 0) return;

  for (const note of selectedNote.value) {
    note.highlight(false);
  }
  selectedNote.value.splice(0, length);
  if (update) {
    triggerRef(selectedNote);
  }
}

function unselect(update = true) {
  unselectConnection(update);
  unselectNote(update);
}

function onFixSelection() {
  let changed = false;
  for (let i = 0; i < selectedNote.value.length; i++) {
    if (!selectedNote.value[i].isAttached()) {
      selectedNote.value.splice(i, 1);
      changed = true;
      i--;
    }
  }
  if (changed) {
    triggerRef(selectedNote);
  }

  changed = false;
  for (let i = 0; i < selectedConnection.value.length; i++) {
    if (!selectedConnection.value[i].isAttached()) {
      selectedConnection.value.splice(i, 1);
      changed = true;
      i--;
    }
  }
  if (changed) {
    triggerRef(selectedConnection);
  }
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
  board.dx = root.value.clientWidth / 2;
  board.dy = root.value.clientHeight / 2;
  board.scale = 1;
}

function createNewNote(img: StoredImage | null = null) {
  unselect();
  history.begin('new note');
  const b = board
  const note = b.createNote(px / b.scale - b.dx, py / b.scale - b.dy, 256, '', img);
  note.highlight();
  selectedNote.value.push(note);
  triggerRef(selectedNote);
  history.end();
}

function createNewImageNote() {
  imageSelector.value.select()
    .then(img => createNewNote(img))
    .catch(() => {});
}

function createNewNoteAtCenter(img: StoredImage | null = null) {
  unselect();
  history.begin('new note');
  const b = board
  const note = b.createNote(b.width / 2 / b.scale - b.dx, b.height / 2 / b.scale - b.dy, 256, '', img);
  selectedNote.value.push(note);
  note.highlight();
  history.end();
}

function createNewImageNoteAtCenter() {
  imageSelector.value.select()
    .then(img => createNewNoteAtCenter(img))
    .catch(() => {});
}

function onNoteCreated(note: NoteView) {
  note.attach(noteContainer.value);
  if (isEditable()) {
    attachNoteListener(note);
  }
}

function onBeforeNoteDetached(note: NoteView) {
  if (!isEditable()) return;
  removeNoteListener(note);
  fixSelection.trigger();
}

function attachNoteListener(note: NoteView) {
  note.clicked.listen(onNoteClicked);
  note.beforeDetached.listen(onBeforeNoteDetached);
  note.startDrag.listen(onStartDragNote);
  note.dragging.listen(onDragNote);
  note.endDrag.listen(onEndDragNote);
  note.resizing.listen(onNoteResizing);
}

function removeNoteListener(note: NoteView) {
  note.clicked.remove(onNoteClicked);
  note.beforeDetached.remove(onBeforeNoteDetached);
  note.startDrag.remove(onStartDragNote);
  note.dragging.remove(onDragNote);
  note.endDrag.remove(onEndDragNote);
  note.resizing.remove(onNoteResizing);
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
  history.end();
}

function onStartDragNote(note: NoteView) {
  if (selectedNote.value.indexOf(note) === -1) {
    draggedNote = note;
  } else {
    draggedNote = null;
  }
}

function onDragNote(note: NoteView, dx: number, dy: number) {
  history.begin('move note');
  if (draggedNote === null) {
    moveNote(dx, dy);
  } else {
    draggedNote.move(dx, dy);
  }
}

function onEndDragNote(note: NoteView) {
  history.end();
}

function onNoteResizing(note: NoteView) {
  history.end();
  history.begin('resize note')
}

function moveNote(dx: number, dy: number) {
  for (const note of selectedNote.value) {
    note.move(dx, dy);
  }
}

function moveNoteLeft() {
  history.begin('move note horizontal');
  moveNote(-SENSITIVITY, 0);
}

function moveNoteRight() {
  history.begin('move note horizontal');
  moveNote(SENSITIVITY, 0);
}

function moveNoteUp() {
  history.begin('move note vertical');
  moveNote(0, -SENSITIVITY);
}

function moveNoteDown() {
  history.begin('move note vertical');
  moveNote(0, SENSITIVITY);
}

function onConnectionCreated(conn: ConnectionView) {
  history.end();
  conn.attach(svg.value);
  conn.updateView();
  if (isEditable()) {
    attachConnectionListener(conn);
  }
}

function onBeforeConnectionDetached(conn: ConnectionView) {
  if (!isEditable()) return;
  removeConnectionListener(conn);
  fixSelection.trigger();
}

function attachConnectionListener(conn: ConnectionView) {
  conn.clicked.listen(onConnectionClicked);
  conn.beforeDetached.listen(onBeforeConnectionDetached)
}

function removeConnectionListener(conn: ConnectionView) {
  conn.clicked.remove(onConnectionClicked);
  conn.beforeDetached.remove(onBeforeConnectionDetached);
}

function onConnectionClicked(conn: ConnectionView) {
  unselectNote();
  if (!keyboard.shiftPressed) {
    unselectConnection(false);
  }
  const index = selectedConnection.value.indexOf(conn);
  if (index === -1) {
    selectedConnection.value.push(conn);
    conn.highlight();
  } else {
    selectedConnection.value.splice(index, 1);
    conn.highlight(false);
  }
  history.end();
  triggerRef(selectedConnection);
}

function disableEditing() {
  dropArea.dropped.remove(onFileDropped);
  dropArea.detach();
  keyboard.removeAction('delete', onPressDelete);
  keyboard.removeAction('force-delete', onForceDelete);
  keyboard.removeAction('new-note', createNewNote);
  keyboard.removeAction('new-image-note', createNewImageNote);
  keyboard.removeAction('select-all-note', selectAllNote);
  keyboard.removeAction('select-all-connection', selectAllConnection);
  keyboard.removeAction('select-like-connection', selectLikeConnection);
  keyboard.removeAction('select-like-color', selectLikeConnectionColor);
  keyboard.removeAction('select-like-size', selectLikeConnectionSize);
  keyboard.removeAction('select-like-dash', selectLikeConnectionDash);
  keyboard.removeAction('cancel', unselect);
  keyboard.removeAction('move-left', moveNoteLeft);
  keyboard.removeAction('move-right', moveNoteRight);
  keyboard.removeAction('move-up', moveNoteUp);
  keyboard.removeAction('move-down', moveNoteDown);

  for (const conn of board.connections) {
    removeConnectionListener(conn);
  }
  for (const note of board.notes) {
    removeNoteListener(note);
  }
}

function enableEditing() {
  dropArea.dropped.listen(onFileDropped);
  dropArea.attach(root.value);
  keyboard.overrideAction('delete', onPressDelete);
  keyboard.overrideAction('force-delete', onForceDelete);
  keyboard.overrideAction('new-note', createNewNote);
  keyboard.overrideAction('new-image-note', createNewImageNote);
  keyboard.overrideAction('select-all-note', selectAllNote);
  keyboard.overrideAction('select-all-connection', selectAllConnection);
  keyboard.overrideAction('select-like-connection', selectLikeConnection);
  keyboard.overrideAction('select-like-color', selectLikeConnectionColor);
  keyboard.overrideAction('select-like-size', selectLikeConnectionSize);
  keyboard.overrideAction('select-like-dash', selectLikeConnectionDash);
  keyboard.overrideAction('cancel', unselect);
  keyboard.overrideAction('move-left', moveNoteLeft);
  keyboard.overrideAction('move-right', moveNoteRight);
  keyboard.overrideAction('move-up', moveNoteUp);
  keyboard.overrideAction('move-down', moveNoteDown);

  for (const note of board.notes) {
    attachNoteListener(note);
  }
  for (const conn of board.connections) {
    attachConnectionListener(conn);
  }
}

onMounted(async() => {
  board.noteCreated.listen(onNoteCreated);
  board.connectionCreated.listen(onConnectionCreated);
  board.previewConnection.listen(onPreviewConnection);
  board.noteSnapshotAction.listen(onNoteSnapshotAction);
  board.connectionSnapshotAction.listen(onconnectionSnapshotAction);

  poinerHandler.attach(root.value, root.value.parentElement!);
  root.value.addEventListener('wheel', onWheel);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  keyboard.overrideAction('reset-view', resetView);

  svg.value.appendChild(previewConnection);
  previewConnection.classList.add('preview-connection');
  previewConnection.setAttribute('stroke-linecap', 'round');

  for (const note of board.notes) {
    note.attach(noteContainer.value);
  }

  // Wait until right after the note have proper position relative to the canvas
  setTimeout(function () {
    for (const conn of board.connections) {
      conn.attach(svg.value);
      conn.updateView();
    }
  }, 0);

  if (board.editable) {
    enableEditing();
  }
});

onBeforeUnmount(() => {
  board.noteCreated.remove(onNoteCreated);
  board.connectionCreated.remove(onConnectionCreated);
  board.previewConnection.remove(onPreviewConnection);
  board.noteSnapshotAction.remove(onNoteSnapshotAction);
  board.connectionSnapshotAction.remove(onconnectionSnapshotAction);

  poinerHandler.detach();
  root.value.removeEventListener('wheel', onWheel);
  window.removeEventListener('resize', onWindowResize);
  keyboard.removeAction('reset-view', resetView);
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
    :history="history"
    @home="resetView"
    @new-note="createNewNoteAtCenter"
    @new-image-note="createNewImageNoteAtCenter"
    @tool-changed="setActiveTool($event)"
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
      <div v-if="selectArea" class="note select-area" :style="{
        '--x': selectArea.l + 'px',
        '--y': selectArea.t + 'px',
        width: selectArea.width + 'px',
        height: selectArea.height + 'px',
      }"></div>
    </div>

    <div class="overlay">
      <div>
        <FontAwesomeIcon :icon="faUpload" />
        Upload Image
      </div>
    </div>
  </div>

  <ConnectionEditor v-if="selectedConnection.length > 0" :connection="[...selectedConnection]" :delete="onPressDelete" :history="history" />
  <NoteEditor v-if="selectedNote.length === 1" :note="selectedNote[0]" :history="history" />
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

.select-area {
  border-radius: 0px;
  border-width: calc(2px / var(--scale));
  border-color: var(--active-color);
  background-color: var(--hover-color);
  opacity: 0.5;
  z-index: 1;
  user-select: none;
  padding: 0px;
}
</style>

<style>
#app {
  display: flex;
  flex-direction: column;
}
</style>

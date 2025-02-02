import { ImageStorage } from "@/ImageStorage";
import { BoardView } from "@/model/BoardView";
import { expect, test } from "vitest";
import ActionHistory from "./ActionHistory";
import { Snapshot } from "./Snapshot";

const HISTORY_LIMIT = 50;

function newActionHistory(board: BoardView) {
  const imgStore = new ImageStorage(null!);
  const history = new ActionHistory(HISTORY_LIMIT, {
    apply(snapshot) {
      board.applySnapshot(imgStore, snapshot);
    },
  }, () => new Snapshot(board.id));

  board.noteSnapshotAction.listen((backward, forward) => history.addNoteSnapshotAction(backward, forward));
  board.connectionSnapshotAction.listen((backward, forward) => history.addConnectionSnapshotAction(backward, forward));

  return history;
}

test('start state', () => {
  const board = new BoardView('');
  const history = newActionHistory(board);
  expect(history.canUndo()).toBe(false);
  expect(history.canRedo()).toBe(false);
});

test('action, undo, redo', () => {
  const container = document.createElement('div');
  const board = new BoardView('');
  const history = newActionHistory(board);

  history.begin('new note');
  const note = board.newNote(123, 0, 0, '');
  note.attach(container);
  history.end();

  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);

  history.undo();
  expect(board.notes.length).toBe(0);
  expect(history.canUndo()).toBe(false);
  expect(history.canRedo()).toBe(true);

  history.redo();
  expect(board.notes[0]?.id).toEqual(note.id);
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);
});

test('2 action, undo, redo', () => {
  const container = document.createElement('div');
  const board = new BoardView('');
  const history = newActionHistory(board);

  history.begin('new note');
  const note = board.newNote(123, 0, 0, '');
  note.attach(container);

  history.begin('move note');
  note.move(100, 200)

  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);

  history.undo();
  expect(note.x).toBe(0);
  expect(note.y).toBe(0);
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(true);

  history.redo();
  expect(note.x).toBe(100);
  expect(note.y).toBe(200);
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);
});


test('2 action, undo, action, undo, redo', () => {
  const container = document.createElement('div');
  const board = new BoardView('');
  const history = newActionHistory(board);

  // 1st action
  history.begin('new note');
  const note = board.newNote(123, 0, 0, '');
  note.attach(container);

  // 2nd action
  history.begin('move note');
  note.move(100, 200);

  // undo
  history.undo();
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(true);

  // 3rd action
  history.begin('move note');
  note.move(300, 400);
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);

  // undo
  history.undo();
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(true);
  expect(note.x).toBe(0);
  expect(note.y).toBe(0);

  // undo
  history.redo();
  expect(history.canUndo()).toBe(true);
  expect(history.canRedo()).toBe(false);
  expect(note.x).toBe(300);
  expect(note.y).toBe(400);
});

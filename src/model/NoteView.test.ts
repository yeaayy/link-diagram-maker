import { ImageStorage } from "@/ImageStorage";
import { Snapshot, SnapshotType, type NoteSnapshotActionEdit } from "@/snapshot/Snapshot";
import { expect, test } from "vitest";
import { BoardView } from "./BoardView";

function newSnapshot(board: BoardView) {
  const snapshot = new Snapshot(board.id);
  board.noteSnapshotAction.listen((backward, forward) => snapshot.pushNoteSnapshotAction(forward));
  board.connectionSnapshotAction.listen((backward, forward) => snapshot.pushConnectionSnapshotAction(forward));
  return snapshot;
}

test('Destroying StoredImage make NoteView.img set to null', () => {
  const board = new BoardView('');
  const snapshot = newSnapshot(board);
  const imageStorage = new ImageStorage(null!);
  const PATH = 'IMAGE';
  const img = imageStorage.getOrAdd(PATH, 1);
  const note = board.newNote(1, 0, 0, 0, '', img);
  note.attach(document.createElement('div'))

  img.destroy();

  expect(note.img).null;
  const noteSnapshot = snapshot.notes.get(snapshot.getNoteKey(note));
  expect(noteSnapshot).exist;

  expect((noteSnapshot as NoteSnapshotActionEdit).img).toBe(0);
});

test('Delete empty note', () => {
  const board = new BoardView('');
  const snapshot = newSnapshot(board);
  const noteContainer = document.createElement('div');

  const note = board.newNote(1, 0, 0, 0, '');
  note.attach(noteContainer);
  snapshot.reset();

  note.destroy();

  const noteSnapshot = snapshot.notes.get(snapshot.getNoteKey(note))
  expect(noteSnapshot).exist;

  expect(noteSnapshot!.type).toBe(SnapshotType.delete);
})

test('Delete note with image', () => {
  const board = new BoardView('');
  const imageStorage = new ImageStorage(null!);
  const img = imageStorage.add('img')
  const snapshot = newSnapshot(board);
  const noteContainer = document.createElement('div');

  const note = board.newNote(1, 0, 0, 0, '', img);
  note.attach(noteContainer);
  snapshot.reset();

  note.destroy();

  const noteSnapshot = snapshot.notes.get(snapshot.getNoteKey(note))
  expect(noteSnapshot).exist;

  expect(noteSnapshot!.type).toBe(SnapshotType.delete);
})

test('Replacing NoteView.img then destroy old image should not effecting NoteView', () => {
  const board = new BoardView('');
  const imageStorage = new ImageStorage(null!);
  const PATH1 = 'IMAGE1';
  const PATH2 = 'IMAGE2';
  const img1 = imageStorage.getOrAdd(PATH1, 1);
  const img2 = imageStorage.getOrAdd(PATH2, 2);
  const note = board.newNote(1, 0, 0, 0, '', img1);

  note.img = img2;
  img1.destroy();

  expect(note.img).toBe(img2);
});

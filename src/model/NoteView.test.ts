import { ImageStorage } from "@/ImageStorage";
import { expect, test } from "vitest";
import { BoardView } from "./BoardView";
import { SnapshotType } from "@/snapshot/Snapshot";

test('Destroying StoredImage make NoteView.img set to null', () => {
  const board = new BoardView('');
  const snapshot = board.snapshot;
  const imageStorage = new ImageStorage(null!);
  const PATH = 'IMAGE';
  const img = imageStorage.getOrAdd(PATH);
  const note = board.newNote(1, 0, 0, '', img);
  note.attach(document.createElement('div'))

  img.destroy();

  expect(note.img).null;
  const noteSnapshot = snapshot.notes.get(snapshot.getNoteKey(note));
  expect(noteSnapshot).exist;

  expect(noteSnapshot!.img).toBe(0);
});

test('Delete empty note', () => {
  const board = new BoardView('');
  const snapshot = board.snapshot;
  const noteContainer = document.createElement('div');

  const note = board.newNote(1, 0, 0, '');
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
  const snapshot = board.snapshot;
  const noteContainer = document.createElement('div');

  const note = board.newNote(1, 0, 0, '', img);
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
  const img1 = imageStorage.getOrAdd(PATH1);
  const img2 = imageStorage.getOrAdd(PATH2);
  const note = board.newNote(1, 0, 0, '', img1);

  note.img = img2;
  img1.destroy();

  expect(note.img).toBe(img2);
});

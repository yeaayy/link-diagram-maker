import { ImageStorage } from "@/ImageStorage";
import { expect, test } from "vitest";
import { BoardView } from "./BoardView";

test('Destroying StoredImage make NoteView.img set to null', () => {
  const board = new BoardView('');
  const imageStorage = new ImageStorage(null!);
  const PATH = 'IMAGE';
  const img = imageStorage.getOrAdd(PATH);
  const note = board.newNote(1, 0, 0, '', img);

  img.destroy();

  expect(note.img).null;
});

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

import { ImageStorage } from "@/ImageStorage";
import { expect, test } from "vitest";

test('ImageStorage.getOrAdd return the same object when using same key', () => {
  const imageStorage = new ImageStorage(null!);
  const PATH = 'IMAGE';
  const img1 = imageStorage.getOrAdd(PATH, 1);
  const img2 = imageStorage.getOrAdd(PATH, 2);

  expect(img1).toBe(img2);
});

test('Destroying StoredImage should cause ImageStorage forget it', () => {
  const imageStorage = new ImageStorage(null!);
  const PATH = 'IMAGE';
  const img = imageStorage.getOrAdd(PATH, 1);

  img.destroy();

  for (const image of imageStorage.getAllRef().value) {
    expect(image === img).false;
  }

  expect(img === imageStorage.getOrAdd(PATH, 1)).false;
});

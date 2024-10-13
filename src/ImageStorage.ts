import { shallowRef, triggerRef, type InjectionKey } from "vue";
import type { HttpClient } from "./http";
import { StoredImage } from "./model/StoredImage";
// @ts-ignore
import CryptoJS from "crypto-js";

function sha256(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function() {
      const wordArray = CryptoJS.lib.WordArray.create(reader.result);
      resolve(CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex));
    };
    reader.onerror = function(e) {
      reject(e);
    }
  });
}

export class ImageStorage {
  private images = shallowRef([] as StoredImage[]);
  private map = new Map<string, StoredImage>();
  private fetched = false;

  constructor(
    private http: HttpClient,
  ) {}

  public add(path: string) {
    const result = new StoredImage(path);
    this.images.value.push(result);
    this.map.set(path, result);
    return result;
  }

  public getOrAdd(path: string) {
    const result = this.map.get(path);
    if (result) return result;
    return this.add(path);
  }

  public getAllRef() {
    return this.images;
  }

  public async getAll() {
    if (this.fetched) {
      return this.images.value;
    }
        const { data } = await this.http.img.get();
        for (const item of data.result) {
          const img = this.getOrAdd(item.path);
          img.id = item.id;
          img.name = item.name;
          img.hash = item.hash;
        }
        triggerRef(this.images);
    this.fetched = true;
    return this.images.value;
  }

  public async upload(file: File): Promise<StoredImage> {
    // Check if file already uploaded.
    const hash = await sha256(file);
    for (const img of await this.getAll()) {
      if (img.hash === hash) {
        return img;
      }
    }

    const { data } = await this.http.img.upload(file);
    const result = this.getOrAdd(data.path);
    result.id = data.id;
    result.name = data.name;
    result.hash = hash;
    return result;
  }

  public async delete(img: StoredImage): Promise<boolean> {
    const { data } = await this.http.img.delete(img.id);
    if (data.success) {
      this.map.delete(img.id);
      const index = this.images.value.findIndex(i => i.id == img.id);
      this.images.value.splice(index, 1);
      triggerRef(this.images);
    }
    return data.success;
  }
}

export const imageStorageKey = Symbol() as InjectionKey<ImageStorage>;

import { shallowRef, triggerRef, type InjectionKey } from "vue";
import type { HttpClient } from "./http";
import { StoredImage } from "./model/StoredImage";

export class ImageStorage {
  private images = shallowRef([] as StoredImage[]);
  private map = new Map<any, StoredImage>();
  private fetched = false;

  constructor(
    private http: HttpClient,
  ) {}

  public add(id: any, path: string, name: string, trigger = true) {
    const result = new StoredImage(id, path, name);
    this.images.value.push(result);
    this.map.set(id, result);
    if (trigger) {
      triggerRef(this.images);
    }
    return result;
  }

  public getOrAdd(id: any, path: string, name: string, trigger = true) {
    const result = this.map.get(id);
    if (result) return result;
    return this.add(id, path, name, trigger);
  }

  public getAllRef() {
    return this.images;
  }

  public async getAll() {
    if (this.fetched) {
      return this.images.value;
    }
    while (true) {
      try {
        const { data } = await this.http.img.get();
        for (const item of data.result) {
          this.getOrAdd(item.id, item.path, item.name, false);
        }
        triggerRef(this.images);
        break
      } catch(e: unknown) {
        console.log(e);
      }
    }
    this.fetched = true;
    return this.images.value;
  }

  public async upload(file: File): Promise<StoredImage> {
    const { data } = await this.http.img.upload(file);
    return this.add(data.id, data.path, data.name);
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

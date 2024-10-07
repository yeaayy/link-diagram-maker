import { AxiosError } from "axios";
import { shallowRef, triggerRef, type InjectionKey } from "vue";
import type { Router } from "vue-router";
import http from "./http";
import { StoredImage } from "./model/StoredImage";

export class ImageStorage {
  private images = shallowRef([] as StoredImage[]);
  private map = new Map<any, StoredImage>();
  private fetched = false;

  constructor(
    private router: Router,
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
    this.getAll();
    return this.images;
  }

  public async getAll() {
    if (this.fetched) {
      return this.images.value;
    }
    while (true) {
      try {
        const { data } = await http.get('img/get.php');
        for (const item of data) {
          this.getOrAdd(item.id, item.path, item.name, false);
        }
        triggerRef(this.images);
        break
      } catch(e: unknown) {
        if (e instanceof AxiosError) {
          if (e.status === 401) {
            this.router.push({ name: 'login' });
            return [];
          }
        }
      }
    }
    this.fetched = true;
    return this.images.value;
  }

  public async upload(file: File): Promise<StoredImage> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await http.post('img/upload.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return this.add(data.id, data.path, data.name);
  }

  public async delete(img: StoredImage): Promise<boolean> {
    const { data } = await http.post('img/delete.php', {
      img: img.id,
    });
    if (!data.error) {
      this.map.delete(img.id);
      const index = this.images.value.findIndex(i => i.id == img.id);
      this.images.value.splice(index, 1);
      triggerRef(this.images);
    }
    return data.error === false;
  }
}

export const imageStorageKey = Symbol() as InjectionKey<ImageStorage>;

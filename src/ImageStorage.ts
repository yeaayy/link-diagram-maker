import { AxiosError } from "axios";
import http from "./http";
import { StoredImage } from "./model/StoredImage";
import { shallowRef, triggerRef, type InjectionKey } from "vue";
import type { Router } from "vue-router";

export class ImageStorage {
  private images = shallowRef([] as StoredImage[]);
  private fetched = false;

  constructor(
    private router: Router,
  ) {}

  public add(id: any, path: string, name: string, trigger = true) {
    const result = new StoredImage(id, path, name);
    this.images.value.push(result);
    if (trigger) {
      triggerRef(this.images);
    }
    return result;
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
          this.add(item.id, item.path, item.name);
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
}

export const imageStorageKey = Symbol() as InjectionKey<ImageStorage>;

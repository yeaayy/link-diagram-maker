import { shallowRef, triggerRef, type InjectionKey } from "vue";
import type { HttpClient } from "./http";
import { StoredImage } from "./model/StoredImage";
// @ts-ignore
import CryptoJS from "crypto-js";
import sleep from "./utils/sleep";
import { AxiosError } from "axios";

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
  private boardId: string | null = null;

  constructor(
    private http: HttpClient,
  ) {}

  public setBoardId(boardId: string) {
    this.boardId = boardId;
  }

  public getBoardId() {
    if (!this.boardId) {
      throw new Error('Board id is not provided');
    }
    return this.boardId;
  }

  public add(path: string) {
    const result = new StoredImage(path);
    result.destroyed.listen(this.onImageDestroyed, this)
    this.images.value.push(result);
    this.map.set(path, result);
    return result;
  }

  public findById(id: any) {
    for (const img of this.map.values()) {
      if (img.id === id) return img;
    }
    return null;
  }

  public getOrAdd(path: string, id: number) {
    let result = this.map.get(path);
    if (result) return result;
    result = this.add(path);
    result.id = id;
    return result;
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
        const { data } = await this.http.img.get(this.getBoardId());
        for (const item of data.result) {
          const img = this.getOrAdd(item.path, item.id);
          img.name = item.name;
          img.hash = item.hash;
        }
        triggerRef(this.images);
        this.fetched = true;
        break
      } catch(e: unknown) {
        if (e instanceof AxiosError) {
          if (e.code == AxiosError.ERR_NETWORK) {
            await sleep(5000);
          } else {
            throw e;
          }
        }
      }
    }
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

    while (true) {
      try {
        const { data } = await this.http.img.upload(this.getBoardId(), file);
        if (!data.success) {
          // TODO: Return a proper value.
          return null!;
        }
        const result = this.getOrAdd(data.path, parseInt(data.id));
        result.name = data.name;
        result.hash = hash;
        return result;
      } catch (e: unknown) {
        // Only expecting network error, so just retry.
        await sleep(5000);
      }
    }
  }

  public async delete(img: StoredImage): Promise<boolean> {
    while (true) {
      try {
        const { data } = await this.http.img.delete(this.getBoardId(), img.id);
        if (data.success) {
          img.destroy();
        }
        return data.success;
      } catch(e: unknown) {
        if (e instanceof AxiosError) {
          if (e.code == AxiosError.ERR_NETWORK) {
            await sleep(5000);
          } else {
            throw e;
          }
        }
      }
    }
  }

  private onImageDestroyed(img: StoredImage) {
    this.map.delete(img.path);
    const index = this.images.value.findIndex(i => i.path == img.path);
    this.images.value.splice(index, 1);
    triggerRef(this.images);
    img.destroyed.remove(this.onImageDestroyed, this);
  }
}

export const imageStorageKey = Symbol() as InjectionKey<ImageStorage>;

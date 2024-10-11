import { inject, type InjectionKey } from "vue";
import type { StoredImage } from "./model/StoredImage";

export const imageSelectorKey = Symbol() as InjectionKey<{
  select(): Promise<StoredImage | null>;
  open(): void;
}>;

export function useImageSelector() {
  return inject(imageSelectorKey)!;
}

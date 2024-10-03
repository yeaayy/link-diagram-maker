import { inject, type InjectionKey } from "vue";

export const loadingKey = Symbol() as InjectionKey<(loading?: boolean) => void>;

export function useLoading() {
  return inject(loadingKey)!;
}

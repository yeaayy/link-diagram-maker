import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { inject, type InjectionKey } from "vue";

export type AlertDialogData = {
  title?: string;
  body?: string;
  icon?: string | object | string[] | IconDefinition;
  button?: string | null;
  local?: boolean;
}

declare function show(body: string): Promise<void>;
declare function show(dialog: AlertDialogData): Promise<void>;

export const alertDialogKey = Symbol() as InjectionKey<typeof show>;

export function useAlert() {
  return inject(alertDialogKey)!;
}

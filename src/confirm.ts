import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { inject, type InjectionKey } from "vue";

export type ConfirmDialogData = {
  title?: string;
  body?: string;
  icon?: string | object | string[] | IconDefinition;
  positiveButton?: string;
  negativeButton?: string;
}

declare function show(title: string): Promise<boolean>;
declare function show(dialog: ConfirmDialogData): Promise<boolean>;

export const confirmDialogKey = Symbol() as InjectionKey<typeof show>;

export function useConfirm() {
  return inject(confirmDialogKey)!;
}

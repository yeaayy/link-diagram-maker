import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { inject, type InjectionKey } from "vue";

export type PromptDialogData = {
  title?: string;
  icon?: string | object | string[] | IconDefinition;
  positiveButton?: string;
  negativeButton?: string;
  placeholder?: string;
  default?: string;
}

declare function show(title: string): Promise<string | null>;
declare function show(dialog: PromptDialogData): Promise<string | null>;

export const promptDialogKey = Symbol() as InjectionKey<typeof show>;

export function usePrompt() {
  return inject(promptDialogKey)!;
}

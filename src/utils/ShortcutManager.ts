import { inject, type InjectionKey } from "vue";
import { Key, type Settings } from "./Settings";
import { type ShortcutID } from "./Shortcut";
import keyboard from "./keyboard";

export class ShortcutManager {
  private key;
  private allShortcut;
  private settings;

  constructor(settings: Settings) {
    this.settings = settings;

    const defaultShortcut = this.getDefaultShortcut();
    this.key = new Key(defaultShortcut, 'shortcut');
    this.allShortcut = settings.get(this.key);

    let changed = false;
    for (const a in defaultShortcut) {
      const actionId = a as ShortcutID;
      let shortcut;
      if (!(actionId in this.allShortcut)) {
        shortcut = this.allShortcut[actionId] = defaultShortcut[actionId];
        changed = true;
      } else {
        shortcut = this.allShortcut[actionId];
      }

      for (let i = 0; i < shortcut.length; i++) {
        const key = shortcut[i];
        if (!keyboard.setShortcut(key, actionId)) {
          // Remove conflicting shortcut.
          changed = true;
          shortcut.splice(i, 1);
          i--;
        }
      }
    }
    for (const actionId in this.allShortcut) {
      if (!(actionId in defaultShortcut)) {
        delete (this.allShortcut as any)[actionId];
        changed = true;
      }
    }

    if (changed) {
      settings.set(this.key, this.allShortcut);
    }
  }

  public hasShortcut(key: string, excludeId?: ShortcutID) {
    const actionId = keyboard.getShortcut(key);
    return actionId !== undefined && actionId !== excludeId;
  }

  public addShortcut(key: string, actionId: ShortcutID) {
    if (keyboard.setShortcut(key, actionId)) {
      this.allShortcut[actionId].push(key);
      return true;
    }
    return false;
  }

  public changeShortcut(newKey: string, oldKey: string, actionId: ShortcutID) {
    if (newKey === oldKey) {
      return true;
    }
    const list = this.allShortcut[actionId];
    const index = list.indexOf(oldKey);
    if (index === -1) {
      return false;
    }
    if (!keyboard.setShortcut(newKey, actionId)) {
      return false;
    }
    keyboard.removeShortcut(oldKey);
    list[index] = newKey;

    this.settings.set(this.key, this.allShortcut);
    return true;
  }

  public removeShortcut(key: string, actionId: ShortcutID) {
    const list = this.allShortcut[actionId];
    const index = list.indexOf(key);
    if (index === -1) {
      return false;
    }
    keyboard.removeShortcut(key);
    list.splice(index, 1);
    this.settings.set(this.key, this.allShortcut);
    return true;
  }

  public getAllShortcut() {
    return this.allShortcut;
  }

  public getShortcut(name: ShortcutID) {
    return this.allShortcut[name];
  }

  private getDefaultShortcut() {
    return <{[Key in ShortcutID]: string[]}> {
      'note-selection-tool': ['s'],
      'conn-selection-tool': ['c'],
      'hand-tool': ['space', 'h'],
      'delete': ['delete'],
      'force-delete': ['shift+delete'],
      'new-note': ['alt+n', 'ctrl+shift+n'],
      'new-image-note': ['alt+i'],
      'select-all-note': ['ctrl+a'],
      'select-all-connection': ['ctrl+alt+a'],
      'select-like-connection': ['alt+a'],
      'select-like-color': ['alt+c'],
      'select-like-size': ['alt+s'],
      'select-like-dash': ['alt+d'],
      'accept': ['enter'],
      'cancel': ['escape'],
      'move-left': ['arrowleft'],
      'move-up': ['arrowup'],
      'move-down': ['arrowdown'],
      'move-right': ['arrowright'],
      'save': ['ctrl+s'],
      'undo': ['ctrl+z'],
      'redo': ['ctrl+shift+z'],
      'reset-view': ['home'],
    }
  }
}

export const ShortcutManagerKey = Symbol() as InjectionKey<ShortcutManager>;

export default function useShortcutManager() {
  return inject(ShortcutManagerKey)!;
}

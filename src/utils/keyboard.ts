import type { ShortcutID } from "./Shortcut";
import TypedEventListener from "./TypedEventListener";

type OverrideHandler = (e: KeyboardEvent, key: string) => (boolean | void);

type KeyboardActionObject = {
  action(): boolean | void;
  instance: unknown;
}

class KeyboardAction {
  public readonly ctrlState = new TypedEventListener<[isPressed: boolean]>();
  public readonly shiftState = new TypedEventListener<[isPressed: boolean]>();

  private _ctrlPressed = false;
  private _shiftPressed = false;
  private actions = new Map<ShortcutID, KeyboardActionObject[]>();
  private shortcuts = new Map<string, ShortcutID>();
  private overrideHandler: null | OverrideHandler = null;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', (e) => this.onWindowUnfocus(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.target !== document.body) return;
    switch (e.key) {
      case 'Control':
        this._ctrlPressed = true;
        this.ctrlState.emit(true);
        break;
      case 'Meta':
        break;
      case 'Alt':
        break;
      case 'Shift':
        this._shiftPressed = true;
        this.shiftState.emit(true);
        break;
      default:
        let keyList = [];
        if (e.ctrlKey) keyList.push('ctrl');
        if (e.altKey) keyList.push('alt');
        if (e.shiftKey) keyList.push('shift');
        if (e.metaKey) keyList.push('meta');
        keyList.push(e.key === ' ' ? 'space' : e.key.toLowerCase());
        const key = keyList.join('+');

        let result = this.overrideHandler?.call(undefined, e, key);
        if (result) {
          return;
        }

        const actionId = this.shortcuts.get(key);
        if (actionId === undefined) {
          return;
        }
        const actionList = this.actions.get(actionId);
        if (!actionList || actionList.length === 0) {
          return;
        }
        const action = actionList[actionList.length - 1];
        if (!action.action.call(action.instance)) {
          e.preventDefault();
        }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    switch (e.key) {
      case 'Control':
        this._ctrlPressed = false;
        this.ctrlState.emit(false);
        break;
      case 'Shift':
        this._shiftPressed = false;
        this.shiftState.emit(false);
        break;
    }
  }

  private onWindowUnfocus(e: UIEvent) {
    this._ctrlPressed = false;
    this.ctrlState.emit(false);
    this._shiftPressed = false;
    this.shiftState.emit(false);
  }

  setOverrideHandler(handler: OverrideHandler | null) {
    this.overrideHandler = handler;
  }

  public overrideAction(actionId: ShortcutID, action: () => void, thisInstance?: unknown) {
    let actionList = this.actions.get(actionId);
    if (actionList === undefined) {
      actionList = [];
      this.actions.set(actionId, actionList);
    }
    actionList.push({
      action,
      instance: thisInstance,
    });
  }

  public removeAction(actionId: ShortcutID, action: () => void, thisInstance?: unknown) {
    let actionList = this.actions.get(actionId);
    if (actionList === undefined) {
      return;
    }
    const index = actionList.findIndex(v => v.action === action && v.instance === thisInstance);
    if (index !== -1) {
      actionList.splice(index, 1);
    }
    if (actionList.length === 0) {
      this.actions.delete(actionId);
    }
  }

  public setShortcut(key: string, actionId: ShortcutID): boolean {
    if (this.shortcuts.has(key)) {
      return false;
    }
    this.shortcuts.set(key, actionId);
    return true;
  }

  public removeShortcut(key: string): boolean {
    return this.shortcuts.delete(key);
  }

  public getShortcut(key: string) {
    return this.shortcuts.get(key);
  }

  public get ctrlPressed() {
    return this._ctrlPressed;
  }

  public get shiftPressed() {
    return this._shiftPressed;
  }
}

type EventWithModifier = {
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

export function getModifier(e: EventWithModifier) {
  const modList = [];
  if (e.metaKey) modList.push('meta');
  if (e.ctrlKey) modList.push('ctrl');
  if (e.altKey) modList.push('alt');
  if (e.shiftKey) modList.push('shift');
  return modList.join('+')
}

const keyboard = new KeyboardAction();
if (import.meta.env.DEV) {
  (window as any).keyboard = keyboard;
}
export default keyboard;

import TypedEventListener from "./TypedEventListener";

class KeyboardAction {
  public readonly ctrlState = new TypedEventListener<[isPressed: boolean]>();
  public readonly shiftState = new TypedEventListener<[isPressed: boolean]>();

  private _ctrlPressed = false;
  private _shiftPressed = false;
  private shortcut = new Map<string, TypedEventListener<void>>();

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', (e) => this.onWindowUnfocus(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Control':
        this._ctrlPressed = true;
        this.ctrlState.emit(true);
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
        keyList.push(e.key);
        const key = keyList.join('+').toLowerCase();

        const listeners = this.shortcut.get(key);
        if (listeners && listeners.hasListener()) {
          listeners.emit();
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

  public addShortcut(key: string, action: () => void, thisInstance?: unknown) {
    let listeners = this.shortcut.get(key);
    if (!listeners) {
      listeners = new TypedEventListener<void>();
      this.shortcut.set(key, listeners);
    }
    return listeners.listen(action, thisInstance);
  }

  public removeShortcut(key: string, action: () => void, thisInstance?: unknown): boolean {
    const listeners = this.shortcut.get(key);
    if (!listeners) {
      return false;
    }
    return listeners.remove(action, thisInstance);
  }

  public get ctrlPressed() {
    return this._ctrlPressed;
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
// @ts-ignore
window.keyboard = keyboard;
export default keyboard;

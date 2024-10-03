
type EventData<T> = T extends void ? [] : T extends any[] ? T : [T];
type EventListener<T> = (...data: EventData<T>) => void;
type ListenerContext<T> = {
  this: unknown,
  listener: EventListener<T>,
}

export default class TypedEventListener<T> {
  private listeners: ListenerContext<T>[] = [];
  private pendingRemoveIndex: number[] = [];
  private emitting: boolean = false;

  listen(listener: EventListener<T>, thisInstance?: unknown) {
    const index = this.listeners.findIndex(lc => lc.listener === listener && lc.this === thisInstance);
    if (index >= 0) return;
    this.listeners.push({
      this: thisInstance,
      listener,
    });
  }

  remove(listener: EventListener<T>, thisInstance?: unknown): boolean {
    const index = this.listeners.findIndex(lc => lc.listener === listener && lc.this === thisInstance);
    if (index == -1) return false;
    if (this.emitting) {
      this.pendingRemoveIndex.push(index);
    } else {
      this.listeners.splice(index, 1);
    }
    return true;
  }

  emit(...data: EventData<T>) {
    this.emitting = true;
    for (const lc of this.listeners) {
      lc.listener.call(lc.this, ...data);
    }
    this.emitting = false;

    if (this.pendingRemoveIndex.length == 0) return;
    this.pendingRemoveIndex.sort((a, b) => b - a);
    for (const index of this.pendingRemoveIndex.splice(0, this.pendingRemoveIndex.length)) {
      this.listeners.splice(index, 1);
    }
  }

  transfer(dst: TypedEventListener<T>) {
    dst.listeners.push(...this.listeners.splice(0, this.listeners.length));
  }

  clear() {
    if (this.emitting) {
      for (let i = this.listeners.length; i >= 0; i--) {
        this.pendingRemoveIndex.push(i);
      }
    } else {
      this.listeners.splice(0, this.listeners.length);
    }
  }

  hasListener() {
    return this.listeners.length > 0;
  }
}

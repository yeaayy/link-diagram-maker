import TypedEventListener from "@/utils/TypedEventListener";
import type { ConnectionSnapshotAction, NoteSnapshotAction, Snapshot } from "./Snapshot";

type SnapshotFactory = (() => Snapshot) | {
  newSnapshot: () => Snapshot;
}

type Action = {
  name: string;
  backward: Snapshot;
  forward: Snapshot;
}

export type ActionHistoryTarget = {
  apply(snapshot: Snapshot): void;
}

export default class ActionHistory {
  public  readonly changed = new TypedEventListener<ActionHistory>();

  private _limit;
  private history: Action[] = [];
  private index = -1;
  private historyName: null | string = null;
  private curr: Action | null = null;
  private snapshotFactory: SnapshotFactory;
  private target: ActionHistoryTarget;
  private record = true;

  constructor(limit: number, target: ActionHistoryTarget, snapshotFactory: SnapshotFactory) {
    this._limit = limit;
    this.target = target;
    this.snapshotFactory = snapshotFactory;
  }

  public begin(name: string) {
    if (this.historyName !== name || this.curr === null) {
      if (name === '') {
        console.warn('Begin null');
      }
      this.historyName = name;
      this.trimAction();
      this.curr = this.newAction(name);
      this.history.push(this.curr);
      this.index++;
      this.trimHistory();
    }
  }

  public end() {
    this.historyName = null;
    this.curr = null;
  }

  public get limit() {
    return this._limit;
  }

  public set limit(limit: number) {
    if (limit <= 0) limit = 0;
    this._limit = limit;
    this.trimHistory();
  }

  public canUndo() {
    return this.index >= 0;
  }

  public getUndoName(): string | undefined {
    if (!this.canUndo()) return undefined;
    return this.history[this.index].name;
  }

  public canRedo() {
    return this.index + 1 < this.history.length;
  }

  public getRedoName(): string | undefined {
    if (!this.canRedo()) return undefined;
    return this.history[this.index + 1].name;
  }

  public redo() {
    if (!this.canRedo()) console.warn('Redo check fail');
    this.record = false;
    this.target.apply(this.history[this.index + 1].forward);
    this.record = true;
    this.index++;
    this.changed.emit(this);
  }

  public undo() {
    if (!this.canUndo   ()) console.warn('Undo check fail');
    this.record = false;
    this.target.apply(this.history[this.index].backward);
    this.record = true;
    this.index--;
    this.end();
    this.changed.emit(this);
  }

  private newSnapshot() {
    if (this.snapshotFactory instanceof Function) {
      return this.snapshotFactory();
    } else {
      return this.snapshotFactory.newSnapshot();
    }
  }

  private newAction(name: string): Action {
    return {
      name,
      backward: this.newSnapshot(),
      forward: this.newSnapshot(),
    };
  }

  private trimHistory() {
    while (this.history.length > this._limit) {
      this.history.shift();
      this.index--;
    }
  }

  private trimAction() {
    while (this.history.length > (this.index + 1)) {
      this.history.pop();
    }
  }

  public addConnectionSnapshotAction(backward: ConnectionSnapshotAction, forward: ConnectionSnapshotAction) {
    if (!this.record) return;
    if (this.curr === null) {
      this.begin('');
    }
    this.curr!.backward.shiftConnectionSnapshotAction(backward);
    this.curr!.forward.pushConnectionSnapshotAction(forward);
    this.changed.emit(this);
  }

  public addNoteSnapshotAction(backward: NoteSnapshotAction, forward: NoteSnapshotAction) {
    if (!this.record) return;
    if (this.curr === null) {
      this.begin('');
    }
    this.curr!.backward.shiftNoteSnapshotAction(backward);
    this.curr!.forward.pushNoteSnapshotAction(forward);
    this.changed.emit(this);
  }

  toRaw() {
    const result = [];
    for (const a of this.history) {
      result.push({
        name: a.name,
        backward: a.backward.toRaw(),
        forward: a.forward.toRaw(),
      });
    }
    return result;
  }

  fromRaw(data: any) {
    for (const a of data) {
      this.history.push({
        name: a.name,
        backward: this.newSnapshot().fromRaw(a.backward),
        forward: this.newSnapshot().fromRaw(a.forward),
      });
    }
  }
}

import TypedEventListener from "@/utils/TypedEventListener";
import type { ConnPosition } from "../model/ConnectionView";

export enum SnapshotType {
  create,
  edit,
  delete,
}

export type SnapshotActionCreate<I, D> = {type: SnapshotType.create} & I & D;
export type SnapshotActionEdit<I, D> = {type: SnapshotType.edit} & I & Partial<D>;
export type SnapshotActionDelete<I> = {type: SnapshotType.delete} & I;
export type SnapshotAction<I, D> =
  SnapshotActionCreate<I, D> |
  SnapshotActionEdit<I, D> |
  SnapshotActionDelete<I>;

export function mergeSnapshotAction<I, D>(a: SnapshotAction<I, D> | undefined, b: SnapshotAction<I, D>): SnapshotAction<I, D> | undefined | null {
  if (a === undefined)
    return {...b};
  switch(a.type) {
    case SnapshotType.create:
      switch (b.type) {
        case SnapshotType.edit:
          return {
            ...a,
            ...b,
            type: SnapshotType.create,
          };
        case SnapshotType.delete:
          return undefined;
      }
      break;
    case SnapshotType.edit:
      switch (b.type) {
        case SnapshotType.edit:
          return {
            ...a,
            ...b,
          };
        case SnapshotType.delete:
          return b;
      }
      break;
    case SnapshotType.delete:
      if (b.type === SnapshotType.create) {
        return {
          ...b,
          type: SnapshotType.edit,
        };
      }
  }
  return null;
}

export type NoteID = {id: number};
export type NoteData = {
  x: number;
  y: number;
  text: string;
  img: number;
};
export type NoteSnapshotActionCreate = SnapshotActionCreate<NoteID, NoteData>;
export type NoteSnapshotActionEdit = SnapshotActionEdit<NoteID, NoteData>;
export type NoteSnapshotActionDelete = SnapshotActionDelete<NoteID>;
export type NoteSnapshotAction = SnapshotAction<NoteID, NoteData>;

export type ConnectionID = {
  a: number,
  pa: ConnPosition,
  b: number,
  pb: ConnPosition,
}
export type ConnectionData = {
  color: string;
  size: number;
  dash: string;
}
export type ConnectionSnapshotActionCreate = SnapshotActionCreate<ConnectionID, ConnectionData>;
export type ConnectionSnapshotActionEdit = SnapshotActionEdit<ConnectionID, ConnectionData>;
export type ConnectionSnapshotActionDelete = SnapshotActionDelete<ConnectionID>;
export type ConnectionSnapshotAction = SnapshotAction<ConnectionID, ConnectionData>;

export class Snapshot {
  public notes = new Map<string, NoteSnapshotAction>();
  public connections = new Map<string, ConnectionSnapshotAction>();

  public readonly state = new TypedEventListener<[dirty: boolean]>();
  private _isDirty = false;

  constructor(
    private boardId: string,
  ) {}

  public pushNoteSnapshotAction(action: NoteSnapshotAction) {
    const key = this.getNoteKey(action);
    const old = this.notes.get(key);
    const result = mergeSnapshotAction(old, action);
    if (result === null) {
      console.warn(`SnapshotAction not in order: ${old}, ${action}`);
      return;
    } else if (result === undefined) {
      this.notes.delete(key);
    } else {
      this.notes.set(key, result);
    }
    if (!this._isDirty) {
      this.state.emit(true);
    }
    this._isDirty = true;
  }

  public pushConnectionSnapshotAction(action: ConnectionSnapshotAction) {
    const key = this.getConnectionKey(action);
    const old = this.connections.get(key);
    const result = mergeSnapshotAction(old, action);
    if (result === null) {
      console.warn(`SnapshotAction not in order: ${old}, ${action}`);
      return;
    } else if (result === undefined) {
      this.connections.delete(key);
    } else {
      this.connections.set(key, result);
    }
    if (!this._isDirty) {
      this.state.emit(true);
    }
    this._isDirty = true;
  }

  public get isDirty() {
    return this._isDirty;
  }

  public reset() {
    this._isDirty = false;
    this.state.emit(false);
    this.notes.clear();
    this.connections.clear();
  }

  public getNoteKey(note: NoteID) {
    return note.id.toString();
  }

  public getConnectionKey(conn: ConnectionID): string {
    return `${conn.a},${conn.pa}>${conn.b},${conn.pb}`;
  }

  public toRaw() {
    const result = {
      id: this.boardId,
      note: [] as NoteSnapshotAction[],
      conn: [] as ConnectionSnapshotAction[],
    };
    for (const note of this.notes.values()) {
      result.note.push(note);
    }
    for (const conn of this.connections.values()) {
      result.conn.push(conn);
    }
    return result;
  }
}

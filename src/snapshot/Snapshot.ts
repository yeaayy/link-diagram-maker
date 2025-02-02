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

export function mergeSnapshotAction<I extends Object, D extends Object>(a: SnapshotAction<I, D> | undefined, b: SnapshotAction<I, D> | undefined): SnapshotAction<I, D> | undefined | null {
  if (a === undefined) {
    if (b === undefined) {
      return undefined;
    }
    return {...b};
  }
  if (b === undefined) {
    return {...a};
  }
  switch(a.type) {
    case SnapshotType.create:
      switch (b.type) {
        case SnapshotType.edit:
          const result: SnapshotActionCreate<I, D> = {...a};
          for (const prop in b) {
            const key = prop as keyof SnapshotActionEdit<I, D>;
            if (prop !== 'type' && b[key] !== undefined) {
              (result as any)[key] = b[key];
            }
          }
          return result;
        case SnapshotType.delete:
          return undefined;
      }
      break;
    case SnapshotType.edit:
      switch (b.type) {
        case SnapshotType.edit:
          const result = {...a};
          for (const prop in b) {
            const key = prop as keyof SnapshotActionEdit<I, D>;
            if (b[key] !== undefined) {
              result[key] = b[key];
            }
          }
          return result;
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

  constructor(
    private boardId: string,
  ) {}

  public pushNoteSnapshotAction(action: NoteSnapshotAction) {
    const key = this.getNoteKey(action);
    const old = this.notes.get(key);
    const result = mergeSnapshotAction(old, action);
    const isDirty = this.isDirty;
    if (result === null) {
      console.warn('NoteSnapshotAction not in order:', old, action);
      return;
    } else if (result === undefined) {
      this.notes.delete(key);
    } else {
      this.notes.set(key, result);
    }
    this.checkDirty(isDirty);
  }

  public pushConnectionSnapshotAction(action: ConnectionSnapshotAction) {
    const key = this.getConnectionKey(action);
    const old = this.connections.get(key);
    const result = mergeSnapshotAction(old, action);
    const isDirty = this.isDirty;
    if (result === null) {
      console.warn('ConnectionSnapshotAction not in order:', old, action);
      return;
    } else if (result === undefined) {
      this.connections.delete(key);
    } else {
      this.connections.set(key, result);
    }
    this.checkDirty(isDirty);
  }

  public shiftNoteSnapshotAction(action: NoteSnapshotAction) {
    const key = this.getNoteKey(action);
    const old = this.notes.get(key);
    const result = mergeSnapshotAction(action, old);
    const isDirty = this.isDirty;
    if (result === null) {
      console.warn('NoteSnapshotAction not in order:', action, old);
      return;
    } else if (result === undefined) {
      this.notes.delete(key);
    } else {
      this.notes.set(key, result);
    }
    this.checkDirty(isDirty);
  }

  public shiftConnectionSnapshotAction(action: ConnectionSnapshotAction) {
    const key = this.getConnectionKey(action);
    const old = this.connections.get(key);
    const result = mergeSnapshotAction(action, old);
    const isDirty = this.isDirty;
    if (result === null) {
      console.warn('ConnectionSnapshotAction not in order:', action, old);
      return;
    } else if (result === undefined) {
      this.connections.delete(key);
    } else {
      this.connections.set(key, result);
    }
    this.checkDirty(isDirty);
  }

  private checkDirty(prev: boolean) {
    const curr = this.isDirty;
    if (curr === prev) return;
    this.state.emit(curr);
  }

  public get isDirty() {
    return this.notes.size > 0 || this.connections.size > 0;
  }

  public reset() {
    this.notes.clear();
    this.connections.clear();
    this.state.emit(false);
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

  fromRaw(data: any) {
    for (const note of data.note) {
      this.notes.set(this.getNoteKey(note), note);
    }
    for (const conn of data.conn) {
      this.connections.set(this.getConnectionKey(conn), conn);
    }
    return this;
  }
}

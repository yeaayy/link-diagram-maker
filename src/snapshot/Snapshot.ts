import TypedEventListener from "@/utils/TypedEventListener";
import type { ConnPosition, ConnectionView } from "../model/ConnectionView";
import type { NoteView } from "../model/NoteView";

export enum SnapshotType {
  create,
  edit,
  delete,
}

export type ConnectionSnapshot = {
  type: SnapshotType,
  a: number,
  pa: ConnPosition,
  b: number,
  pb: ConnPosition,
  color?: string;
  size?: number;
}

export type NoteSnapshot = {
  type: SnapshotType,
  id: number;
  x?: number;
  y?: number;
  text?: string;
  img?: number;
};

export interface SnapshotAction {
  apply(snapshot: Snapshot): void;
}

export class Snapshot {
  public notes = new Map<string, NoteSnapshot>();
  public connections = new Map<string, ConnectionSnapshot>();

  public readonly state = new TypedEventListener<[dirty: boolean]>();
  private _isDirty = false;

  constructor(
    private boardId: string,
  ) {}

  public push(action: SnapshotAction) {
    action.apply(this);
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

  public getNoteKey(note: NoteView) {
    return note.id.toString();
  }

  public getConnectionKey(conn: ConnectionView): string {
    return `${conn.a.id},${conn.pa}>${conn.b.id},${conn.pb}`;
  }

  public toRaw(): Object {
    const result = {
      id: this.boardId,
      note: [] as NoteSnapshot[],
      conn: [] as ConnectionSnapshot[],
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

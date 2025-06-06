import { Snapshot, type ConnectionSnapshotAction, type NoteSnapshotAction, SnapshotType } from "@/snapshot/Snapshot";
import TypedEventListener from "@/utils/TypedEventListener";
import { ConnectionView, type ConnPosition } from "./ConnectionView";
import { NoteView } from "./NoteView";
import type { StoredImage } from "./StoredImage";
import type { ImageStorage } from "@/ImageStorage";

export class BoardView {
  public dx = 0;
  public dy = 0;
  public width = 0;
  public height = 0;
  public scale = 1;

  public defaultColor = 'ff0000';
  public defaultSize = 5;
  public defaultDash: number[] = [];
  public editable = false;
  public fullAccess = false;
  public name = 'Untitled';

  public readonly notes: NoteView[] = []
  public readonly connections: ConnectionView[] = [];

  public readonly noteCreated = new TypedEventListener<NoteView>();
  public readonly connectionCreated = new TypedEventListener<ConnectionView>();
  public readonly previewConnection = new TypedEventListener<[from: HTMLElement, toX: number, toY: number]>();
  public readonly connectionSnapshotAction = new TypedEventListener<[backward: ConnectionSnapshotAction, forward: ConnectionSnapshotAction]>();
  public readonly noteSnapshotAction = new TypedEventListener<[backward: NoteSnapshotAction, forward: NoteSnapshotAction]>();

  public readonly noteMap = new Map<number, NoteView>();

  constructor(
    public readonly id: string
  ) {
  }

  public newNote(id: number, x: number, y: number, width: number, text: string, img: StoredImage | null = null) {
    const result = new NoteView(this, id, x, y, width, text, img);
    this.notes.push(result);
    this.noteMap.set(id, result);
    this.noteCreated.emit(result);
    return result;
  }

  public createNote(x: number, y: number, width: number, text: string, img: StoredImage | null = null) {
    let id;
    do {
      id = Math.floor(Math.random() * 0x7fffffff);
    } while (this.noteMap.has(id));
    return this.newNote(id, x, y, width, text, img);
  }

  public newConnection(a: number | NoteView, pa: ConnPosition, b: number | NoteView, pb: ConnPosition, color?: string, size?: number, dash?: number[]) {
    if (typeof a === 'number') {
      const noteA = this.noteMap.get(a);
      if (!noteA) throw new Error(`Note with id '${a}' not found`);
      a = noteA;
    }
    if (typeof b === 'number') {
      const noteB = this.noteMap.get(b);
      if (!noteB) throw new Error(`Note with id '${b}' not found`);
      b = noteB;
    }

    if (a.id > b.id) {
      [b, pb, a, pa] = [a, pa, b, pb];
    }
    if (this.isConnected(a, b)) {
      throw new Error(`Note ${a.id} and ${b.id} already connected`)
    }

    if (color === undefined) {
      color = this.defaultColor;
    }
    if (size === undefined) {
      size = this.defaultSize;
    }
    if (dash === undefined) {
      dash = this.defaultDash;
    }

    const result = new ConnectionView(this, a, pa, b, pb, color, size, dash);
    this.connections.push(result);
    this.connectionCreated.emit(result);
    return result;
  }

  public isConnected(a: number | NoteView, b: number | NoteView) {
    if (typeof a === 'number') {
      const noteA = this.noteMap.get(a);
      if (!noteA) throw new Error(`Note with id '${a}' not found`);
      a = noteA;
    }
    if (typeof b !== 'number') {
      b = b.id;
    }

    return a.conn.has(b);
  }

  public applySnapshot(imgStore: ImageStorage, snapshot: Snapshot): boolean {
    // TODO: Check if the snapshot applicable before actually applying.
    for (const a of snapshot.notes.values()) {
      switch (a.type) {
        case SnapshotType.create:
          this.newNote(a.id, a.x, a.y, a.width, a.text, imgStore.findById(a.img));
          break;
        case SnapshotType.edit: {
          const note = this.noteMap.get(a.id);
          if (!note) return false;
          if (a.width !== undefined) {
            note.width = a.width;
          }
          if (a.x !== undefined || a.y !== undefined) {
            note.move(a.x === undefined ? 0 : (a.x - note.x), a.y === undefined ? 0 : (a.y - note.y));
          }
          if (a.text !== undefined) {
            note.text = a.text;
          }
          if (a.img !== undefined) {
            note.img = imgStore.findById(a.img);
          }
          break;
        }
        case SnapshotType.delete: {
          const note = this.noteMap.get(a.id);
          if (!note) return false;
          note.destroy();
          break;
        }
      }
    }
    for (const a of snapshot.connections.values()) {
      switch (a.type) {
        case SnapshotType.create:
          this.newConnection(a.a, a.pa, a.b, a.pb, a.color, a.size, a.dash.length === 0 ? [] : a.dash.split(' ').map(parseFloat));
          break;
        case SnapshotType.edit: {
          const conn = this.findConnection(a.a, a.pa, a.b, a.pb);
          if (!conn) return false;
          if (a.color !== undefined) {
            conn.color = a.color;
          }
          if (a.size !== undefined) {
            conn.size = a.size;
          }
          if (a.dash !== undefined) {
            conn.dash = a.dash.length === 0 ? [] : a.dash.split(' ').map(parseFloat);
          }
          break;
        }
        case SnapshotType.delete: {
          const conn = this.findConnection(a.a, a.pa, a.b, a.pb);
          // Skip when the connection already deleted when the note got deleted.
          // This might skip invalid deletion.
          if (conn) {
            conn.destroy();
          }
          break;
        }
      }
    }
    return true;
  }

  private findConnection(a: number, pa: ConnPosition, b: number, pb: ConnPosition) {
    return this.connections.find(c => c.a.id === a && c.pa === pa && c.b.id === b && c.pb === pb);
  }

  private toRaw() {
    return {
      id: this.id,
      note: this.notes.map(note => {
        return {
          id: note.id,
          x: note.x,
          y: note.y,
          text: note.text,
          img: note.img?.id || 0,
        };
      }),
      conn: this.connections.map(conn => {
        return {
          a: conn.a.id,
          pa: conn.pa,
          b: conn.b.id,
          pb: conn.pb,
          color: conn.color,
          size: conn.size,
          dash: conn.dash.join(' '),
        };
      }),
    };
  }
}

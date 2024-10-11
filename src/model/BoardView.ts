import { Snapshot } from "@/snapshot/Snapshot";
import TypedEventListener from "@/utils/TypedEventListener";
import { ConnectionView, type ConnPosition } from "./ConnectionView";
import { NoteView } from "./NoteView";
import type { StoredImage } from "./StoredImage";

export class BoardView {
  public dx = 0;
  public dy = 0;
  public width = 0;
  public height = 0;
  public scale = 1;

  public defaultColor = 'ff0000';
  public defaultSize = 5;
  public editable = false;
  public name = 'Untitled';

  public readonly notes: NoteView[] = []
  public readonly connections: ConnectionView[] = [];

  public readonly noteCreated = new TypedEventListener<NoteView>();
  public readonly connectionCreated = new TypedEventListener<ConnectionView>();
  public readonly previewConnection = new TypedEventListener<[from: HTMLElement, toX: number, toY: number]>();

  public readonly noteMap = new Map<number, NoteView>();
  public readonly snapshot;

  constructor(
    public readonly id: string
  ) {
    this.snapshot = new Snapshot(id);
  }

  public newNote(id: number, x: number, y: number, text: string, img: StoredImage | null = null) {
    const result = new NoteView(this, id, x, y, text, img);
    this.notes.push(result);
    this.noteMap.set(id, result);
    this.noteCreated.emit(result);
    return result;
  }

  public createNote(x: number, y: number, text: string, img: StoredImage | null = null) {
    let id;
    do {
      id = Math.floor(Math.random() * 0x7fffffff);
    } while (this.noteMap.has(id));
    return this.newNote(id, x, y, text, img);
  }

  public newConnection(a: number | NoteView, pa: ConnPosition, b: number | NoteView, pb: ConnPosition, color?: string, size?: number) {
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

    const result = new ConnectionView(this, a, pa, b, pb, color, size);
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
}

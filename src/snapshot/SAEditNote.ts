import type { NoteView } from "@/model/NoteView";
import { SnapshotType, type NoteSnapshot, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SAEditNote implements SnapshotAction {
  constructor(
    private note: NoteView,
    private fields: (Exclude<keyof NoteSnapshot, 'type' | 'id'>)[],
  ) {}

  apply(s: Snapshot): void {
    const n = this.note;
    const key = s.getNoteKey(n);
    let stored = s.notes.get(key);
    if (stored === undefined) {
      s.notes.set(key, stored = {
        type: SnapshotType.edit,
        id: n.id,
      });
    } else if (stored.type === SnapshotType.delete) {
      stored.type = SnapshotType.edit;
    }
    for (const field of this.fields) {
      switch (field) {
        case 'x':
          stored.x = n.x;
          break;
        case 'y':
          stored.y = n.y;
          break;
        case 'text':
          stored.text = n.text;
          break;
        case 'img':
          stored.img = n.img === null ? 0 : n.img.id;
          break;
      }
    }
  }
}

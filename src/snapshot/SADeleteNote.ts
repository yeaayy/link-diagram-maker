import type { NoteView } from "@/model/NoteView";
import { SnapshotType, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SADeleteNote implements SnapshotAction {
  constructor(
    private note: NoteView,
  ) {}

  apply(s: Snapshot): void {
    const n = this.note;
    const key = s.getNoteKey(n);
    const stored = s.notes.get(key);
    if (stored === undefined) {
      s.notes.set(key, {
        type: SnapshotType.delete,
        id: n.id,
      });
    } else if (stored.type === SnapshotType.create) {
      s.notes.delete(key);
    } else {
      stored.type = SnapshotType.delete;
      delete stored.x;
      delete stored.y;
      delete stored.img;
      delete stored.text;
    }
  }
}

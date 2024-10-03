import type { NoteView } from "@/model/NoteView";
import { SnapshotType, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SACreateNote implements SnapshotAction {
  constructor(
    private note: NoteView
  ) {}

  apply(s: Snapshot): void {
    const n = this.note;
    const key = s.getNoteKey(n);
    const stored = s.notes.get(key);
    s.notes.set(key, {
      type: stored ? SnapshotType.edit : SnapshotType.create,
      id: n.id,
      x: n.x,
      y: n.y,
      text: n.text,
      img: n.img == null ? 0 : n.img.id,
    });
  }
}

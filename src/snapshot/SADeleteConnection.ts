import type { ConnectionView } from "@/model/ConnectionView";
import { SnapshotType, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SADeleteConnection implements SnapshotAction {
  constructor(
    private conn: ConnectionView,
  ) {}

  apply(s: Snapshot): void {
    const c = this.conn;
    const key = s.getConnectionKey(c);
    const stored = s.connections.get(key);
    if (stored === undefined) {
      s.connections.set(key, {
        type: SnapshotType.delete,
        a: c.a.id,
        pa: c.pa,
        b: c.b.id,
        pb: c.pb,
      })
    } else if (stored.type === SnapshotType.create) {
      s.connections.delete(key);
    } else {
      stored.type = SnapshotType.delete;
      delete stored.color;
      delete stored.size;
      delete stored.dash;
    }
  }
}

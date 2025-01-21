import type { ConnectionView } from "@/model/ConnectionView";
import { SnapshotType, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SACreateConnection implements SnapshotAction {
  constructor(
    private conn: ConnectionView,
  ) {}

  apply(s: Snapshot): void {
    const c = this.conn;
    const key = s.getConnectionKey(c);
    const stored = s.connections.get(key);
    s.connections.set(key, {
      type: stored ? SnapshotType.edit : SnapshotType.create,
      a: c.a.id,
      pa: c.pa,
      b: c.b.id,
      pb: c.pb,
      color: c.color,
      size: c.size,
      dash: c.dash.join(' '),
    });
  }
}

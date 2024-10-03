import type { ConnectionView } from "@/model/ConnectionView";
import { SnapshotType, type ConnectionSnapshot, type Snapshot, type SnapshotAction } from "./Snapshot";

export class SAEditConnection implements SnapshotAction {
  constructor(
    private conn: ConnectionView,
    private fields: (Exclude<keyof ConnectionSnapshot, 'type' | 'a' | 'b' | 'pa' | 'pb'>)[],
  ) {}

  apply(s: Snapshot): void {
    const c = this.conn;
    const key = s.getConnectionKey(c);
    let stored = s.connections.get(key);
    if (stored === undefined) {
      s.connections.set(key, stored = {
        type: SnapshotType.edit,
        a: c.a.id,
        pa: c.pa,
        b: c.b.id,
        pb: c.pb,
      });
    } else if (stored.type === SnapshotType.delete) {
      stored.type = SnapshotType.edit;
    }
    for (const field of this.fields) {
      switch (field) {
        case 'color':
          stored.color = c.color;
          break;
        case 'size':
          stored.size = c.size;
          break;
      }
    }
    // if (stored === null) {
    //   console.error('Edit deleted connection.');
    // } else if (stored instanceof Array) {
    //   for (const field of this.fields) {
    //     switch (field) {
    //       case 'color':
    //         stored[4] = c.color;
    //         break;
    //       case 'size':
    //         stored[2] = c.size;
    //         break;
    //     }
    //   }
    // } else {
    //   if (stored === undefined) {
    //     s.connections.set(key, stored = {
    //       a: c.a.id,
    //       pa: c.pa,
    //       b: c.b.id,
    //       pb: c.pb,
    //     });
    //   }
    //   for (const field of this.fields) {
    //     switch (field) {
    //       case 'color':
    //         stored.color = c.color;
    //         break;
    //       case 'size':
    //         stored.size = c.size;
    //         break;
    //     }
    //   }
    // }
  }
}

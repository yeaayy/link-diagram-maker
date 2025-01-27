import type { ConnectionView } from "@/model/ConnectionView";
import { SnapshotType, type ConnectionData, type ConnectionSnapshotActionCreate, type ConnectionSnapshotActionDelete, type ConnectionSnapshotActionEdit, type ConnectionID } from "./Snapshot";

function getId(conn: ConnectionView): ConnectionID {
  return {
    a: conn.a.id,
    pa: conn.pa,
    b: conn.b.id,
    pb: conn.pb,
  }
}

function create(conn: ConnectionView): ConnectionSnapshotActionCreate {
  return {
    type: SnapshotType.create,
    ...getId(conn),
    color: conn.color,
    size: conn.size,
    dash: conn.dash.join(' '),
  };
}

function edit(conn: ConnectionView, ...fields: (keyof ConnectionData)[]) {
  const result:  ConnectionSnapshotActionEdit = {
    type: SnapshotType.edit,
    ...getId(conn),
  };
  for (const field of fields) {
    switch (field) {
      case 'color':
        result.color = conn.color;
        break;
      case 'size':
        result.size = conn.size;
        break;
      case "dash":
        result.dash = conn.dash.join(' ');
        break;
    }
  }
  return result;
}

function _delete(conn: ConnectionView): ConnectionSnapshotActionDelete {
  return {
    type: SnapshotType.delete,
    ...getId(conn),
  };
}

const ConnectionSnapshot = {
  getId,
  create,
  edit,
  delete: _delete,
};

export default ConnectionSnapshot;

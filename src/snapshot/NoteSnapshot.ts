import type { NoteView } from "@/model/NoteView";
import { SnapshotType, type NoteSnapshotActionCreate, type NoteSnapshotActionEdit, type NoteSnapshotActionDelete, type NoteData } from "./Snapshot";

function create(note: NoteView): NoteSnapshotActionCreate {
  return {
    type: SnapshotType.create,
    id: note.id,
    x: note.x,
    y: note.y,
    text: note.text,
    img: note.img?.id | 0,
  };
}

function edit(note: NoteView, ...fields: (keyof NoteData)[]) {
  const result:  NoteSnapshotActionEdit = {
    type: SnapshotType.edit,
    id: note.id,
  };
  for (const field of fields) {
    switch (field) {
      case "x":
        result.x = note.x;
        break;
      case "y":
        result.y = note.y;
        break;
      case "text":
        result.text = note.text;
        break;
      case "img":
        result.img = note.img?.id | 0;
        break;
    }
  }
  return result;
}

function _delete(note: NoteView): NoteSnapshotActionDelete {
  return {
    type: SnapshotType.delete,
    id: note.id,
  };
}

const NoteSnapshot = {
  create,
  edit,
  delete: _delete,
};

export default NoteSnapshot;

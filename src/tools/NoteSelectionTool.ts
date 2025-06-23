import Rect from "@/math/Rect";
import RectMinMax from "@/math/RectMinMax";
import type { BoardView } from "@/model/BoardView";
import type { NoteView } from "@/model/NoteView";
import keyboard from "@/utils/keyboard";
import type { GenericPointerEvent } from "@/utils/PointerHandler";
import PointerHandler from "@/utils/PointerHandler";
import { triggerRef, type Ref, type ShallowRef } from "vue";
import SelectionTool from "./SelectionTool";

export default class NoteSelectionTool extends SelectionTool {

  constructor(
    board: BoardView,
    selectArea: Ref<null | RectMinMax>,
    private selectedNote: ShallowRef<NoteView[]>,
    private unselectNote: (update?: boolean) => void,
    private unselectConnection: (update?: boolean) => void,
  ) {
    super(board, selectArea);
  }

  onPointerEnd(ev: GenericPointerEvent, px: number, py: number): void {
    super.onPointerEnd(ev, px, py);

    if (this.selectArea.value && (!(ev instanceof MouseEvent) || !(ev.buttons & PointerHandler.MOUSE_LEFT_BUTTON))) {
      this.unselectConnection();
      if (!keyboard.shiftPressed) {
        this.unselectNote(false);
      }
      for (const note of this.board.notes) {
        if (!Rect.isRectInsideRectRR(note, this.selectArea.value)) continue;

        if (keyboard.shiftPressed) {
          const index = this.selectedNote.value.indexOf(note);
          if (index === -1) {
            this.selectedNote.value.push(note);
            note.highlight();
          } else {
            this.selectedNote.value.splice(index, 1);
            note.highlight(false);
          }
        } else {
          this.selectedNote.value.push(note);
          note.highlight();
        }
      }
      this.selectArea.value = null;
      triggerRef(this.selectedNote);
    }
  }
}

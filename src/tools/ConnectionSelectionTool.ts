import Rect from "@/math/Rect";
import RectMinMax from "@/math/RectMinMax";
import type { BoardView } from "@/model/BoardView";
import type { ConnectionView } from "@/model/ConnectionView";
import keyboard from "@/utils/keyboard";
import type { GenericPointerEvent, PointerMoveEvent } from "@/utils/PointerHandler";
import PointerHandler from "@/utils/PointerHandler";
import { triggerRef, type Ref, type ShallowRef } from "vue";
import SelectionTool from "./SelectionTool";

export default class ConnectionSelectionTool extends SelectionTool {

  constructor(
    board: BoardView,
    selectArea: Ref<null | RectMinMax>,
    private selectedConnection: ShallowRef<ConnectionView[]>,
    private unselectNote: (update?: boolean) => void,
    private unselectConnection: (update?: boolean) => void,
  ) {
    super(board, selectArea);
  }

  onPointerEnd(ev: GenericPointerEvent, px: number, py: number): void {
    super.onPointerEnd(ev, px, py);

    if (this.selectArea.value && (!(ev instanceof MouseEvent) || !(ev.buttons & PointerHandler.MOUSE_LEFT_BUTTON))) {
      this.unselectNote();
      if (!keyboard.shiftPressed) {
        this.unselectConnection(false);
      }
      for (const conn of this.board.connections) {
        if (!Rect.isRectInsideRectRR(conn.rect, this.selectArea.value)) continue;

        if (keyboard.shiftPressed) {
          const index = this.selectedConnection.value.indexOf(conn);
          if (index === -1) {
            this.selectedConnection.value.push(conn);
            conn.highlight();
          } else {
            this.selectedConnection.value.splice(index, 1);
            conn.highlight(false);
          }
        } else {
          this.selectedConnection.value.push(conn);
          conn.highlight();
        }
      }
      this.selectArea.value = null;
      triggerRef(this.selectedConnection);
    }
  }
}

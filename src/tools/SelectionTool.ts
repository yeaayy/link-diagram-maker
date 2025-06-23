import Rect from "@/math/Rect";
import RectMinMax from "@/math/RectMinMax";
import type { BoardView } from "@/model/BoardView";
import type { ConnectionView } from "@/model/ConnectionView";
import keyboard from "@/utils/keyboard";
import type { GenericPointerEvent, PointerMoveEvent } from "@/utils/PointerHandler";
import PointerHandler from "@/utils/PointerHandler";
import { triggerRef, type Ref, type ShallowRef } from "vue";
import Tool from "./Tool";

export default abstract class SelectionTool extends Tool {
  private pointerInverval: NodeJS.Timeout | null = null;
  protected px = 0;
  protected py = 0;

  constructor(
    board: BoardView,
    protected selectArea: Ref<null | RectMinMax>,
  ) {
    super(board);
  }

  onPointerStart(ev: GenericPointerEvent, px: number, py: number): void {
    if (ev instanceof MouseEvent && (ev.buttons & PointerHandler.MOUSE_LEFT_BUTTON) == 0 || !this.board.editable) {
      return;
    }
    this.px = px;
    this.py = py;
    this.pointerInverval = setInterval(() => this.onPointerIdleInterval(), 1);
  }

  onPointerIdleInterval() {
    if (this.selectArea.value == null) return;

    const SCROLL_AREA = Math.min(this.board.width, this.board.height) * 0.1;
    const SENSITIVITY = 2;
    if (this.px < SCROLL_AREA) {
      this.board.dx += (1 - this.px / SCROLL_AREA) * SENSITIVITY;
    }
    if (this.px > this.board.width - SCROLL_AREA) {
      this.board.dx += (this.board.width - SCROLL_AREA - this.px) / SCROLL_AREA * SENSITIVITY;
    }
    if (this.py < SCROLL_AREA) {
      this.board.dy += (1 - this.py / SCROLL_AREA) * SENSITIVITY;
    }
    if (this.py > this.board.height - SCROLL_AREA) {
      this.board.dy += (this.board.height - SCROLL_AREA - this.py) / SCROLL_AREA * SENSITIVITY;
    }
    const [cnvX, cnvY] = this.transformScreenToCanvas(this.px, this.py);
    this.selectArea.value!.x2 = cnvX;
    this.selectArea.value!.y2 = cnvY;
  }

  onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent): void {
    this.px = e.px;
    this.py = e.py;
    if (ev instanceof MouseEvent && (ev.buttons & PointerHandler.MOUSE_MIDDLE_BUTTON)) {
      this.board.dx += e.dx / this.board.scale;
      this.board.dy += e.dy / this.board.scale;
    } else if (!(ev instanceof MouseEvent) || (ev.buttons & PointerHandler.MOUSE_LEFT_BUTTON)
        && this.board.editable && !this.selectArea.value) {
      this.selectArea.value = new RectMinMax(...this.transformScreenToCanvas(this.px, this.py));
    }
  }

  onPointerEnd(ev: GenericPointerEvent, px: number, py: number): void {
    if (this.pointerInverval) {
      clearInterval(this.pointerInverval);
      this.pointerInverval = null;
    }
  }
}

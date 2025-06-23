import type { BoardView } from "@/model/BoardView";
import type { GenericPointerEvent, PointerMoveEvent } from "@/utils/PointerHandler";

export default abstract class Tool {
  constructor(
    protected board: BoardView,
  ) {}

  transformScreenToCanvas(screenX: number, screenY: number) {
    return [
      screenX / this.board.scale - this.board.dx,
      screenY / this.board.scale - this.board.dy,
    ] as [number, number];
  }
  
  onPointerStart(ev: GenericPointerEvent, px: number, py: number) {}
  onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {}
  onPointerEnd(ev: GenericPointerEvent, px: number, py: number) {}
}

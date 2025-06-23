import type { BoardView } from "@/model/BoardView";
import type { GenericPointerEvent, PointerMoveEvent } from "@/utils/PointerHandler";
import Tool from "./Tool";

export default class HandTool extends Tool {
  constructor(
    board: BoardView,
  ) {
    super(board);
  }

  onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent): void {
    this.board.dx += e.dx / this.board.scale;
    this.board.dy += e.dy / this.board.scale;
  }
}

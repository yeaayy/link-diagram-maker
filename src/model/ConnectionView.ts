import TypedEventListener from "@/utils/TypedEventListener";
import type { NoteView } from "./NoteView";
import type { BoardView } from "./BoardView";
import { SACreateConnection } from "@/snapshot/SACreateConnection";
import { SAEditConnection } from "@/snapshot/SAEditConnection";
import { SADeleteConnection } from "@/snapshot/SADeleteConnection";

export enum ConnPosition {
  left,
  top,
  right,
  bottom,
}

export class ConnectionView {
  private view;
  private _color = ''
  private _size = 0

  public readonly beforeDetached = new TypedEventListener<ConnectionView>();
  public readonly clicked = new TypedEventListener<ConnectionView>();

  constructor(
    private readonly board: BoardView,
    public readonly a: NoteView,
    public readonly pa: ConnPosition,
    public readonly b: NoteView,
    public readonly pb: ConnPosition,
    color: string,
    size: number,
  ) {
    this.view = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    a.conn.push(this)
    b.conn.push(this);
    this.color = color;
    this.size = size;
    this.view.addEventListener('click', this);

    board.snapshot.push(new SACreateConnection(this));
  }

  public attach(dst: SVGElement) {
    dst.appendChild(this.view);
  }

  public detach() {
    if (!this.isAttached()) return;
    this.beforeDetached.emit(this);
    this.view.parentElement!.removeChild(this.view);
  }

  public isAttached() {
    return this.view.parentElement !== null;
  }

  public destroy() {
    this.board.snapshot.push(new SADeleteConnection(this));
    let i = this.a.conn.indexOf(this);
    this.a.conn.splice(i, 1);
    i = this.b.conn.indexOf(this);
    this.b.conn.splice(i, 1);
    this.detach();
  }

  public set color(v: string) {
    this.board.defaultColor = v;
    this._color = v;
    this.view.setAttribute('stroke', '#' + v);

    if (this.isAttached())
      this.board.snapshot.push(new SAEditConnection(this, ['color']));
  }

  public get color() {
    return this._color;
  }

  public set size(v: number) {
    this.board.defaultSize = v;
    this._size = v;
    this.view.setAttribute('stroke-width', v.toString());

    if (this.isAttached())
      this.board.snapshot.push(new SAEditConnection(this, ['size']));
  }

  public get size() {
    return this._size;
  }

  public highlight(highlight = true) {
    if (highlight) {
      this.view.classList.add('highlight');
    } else {
      this.view.classList.remove('highlight');
    }
  }

  public handleEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.clicked.emit(this);
  }

  public updateView() {
    if (!this.a.isAttached() || !this.b.isAttached()) {
      return
    }
    const view = this.view;
    const a = this.a.dots[this.pa].getBoundingClientRect();
    const b = this.b.dots[this.pb].getBoundingClientRect();
    view.x1.baseVal.value = a.x + a.width / 2 - this.board.dx;
    view.y1.baseVal.value = a.y + a.height / 2 - this.board.dy;
    view.x2.baseVal.value = b.x + b.width / 2 - this.board.dx;
    view.y2.baseVal.value = b.y + b.height / 2 - this.board.dy;
  }
}

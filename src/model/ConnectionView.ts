import ConnectionSnapshot from "@/snapshot/ConnectionSnapshot";
import TypedEventListener from "@/utils/TypedEventListener";
import type { BoardView } from "./BoardView";
import type { NoteView } from "./NoteView";

export enum ConnPosition {
  left,
  top,
  right,
  bottom,
}

export class ConnectionView {
  private view;
  private visual;
  private _color = ''
  private _size = 0
  private _dash: number[] = [];

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
    dash: number[],
  ) {
    this.view = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.visual = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.view.classList.add('view');
    this.visual.classList.add('visual');
    a.conn.set(b.id, this);
    b.conn.set(a.id, this);
    this.color = color;
    this.size = size;
    this.dash = dash;
    this.view.addEventListener('click', this);
    this.visual.addEventListener('click', this);

    board.connectionSnapshotAction.emit(ConnectionSnapshot.delete(this), ConnectionSnapshot.create(this));
  }

  public attach(dst: SVGElement) {
    dst.appendChild(this.view);
    dst.appendChild(this.visual);
  }

  public detach() {
    if (!this.isAttached()) return;
    this.beforeDetached.emit(this);
    this.view.parentElement?.removeChild(this.view);
    this.visual.parentElement?.removeChild(this.visual);
  }

  public isAttached() {
    return this.view.parentElement !== null || this.visual.parentElement !== null;
  }

  public destroy() {
    this.board.connectionSnapshotAction.emit(ConnectionSnapshot.create(this), ConnectionSnapshot.delete(this));
    const index = this.board.connections.indexOf(this);
    if (index !== -1) {
      this.board.connections.splice(index, 1);
    }
    this.a.conn.delete(this.b.id);
    this.b.conn.delete(this.a.id);
    this.detach();
  }

  private updateDash() {
    this.visual.setAttribute('stroke-dasharray', this._dash.map(val => val * this._size).join(' '));
  }

  public set color(v: string) {
    const reverse = ConnectionSnapshot.edit(this, 'color');
    this.board.defaultColor = v;
    this._color = v;
    this.view.setAttribute('stroke', '#' + v);
    this.visual.setAttribute('stroke', '#' + v);

    if (this.isAttached())
      this.board.connectionSnapshotAction.emit(reverse, ConnectionSnapshot.edit(this, 'color'));
  }

  public get color() {
    return this._color;
  }

  public set size(v: number) {
    const reverse = ConnectionSnapshot.edit(this, 'size');
    this.board.defaultSize = v;
    this._size = v;
    this.updateDash();
    this.view.setAttribute('stroke-width', (v * 2).toString());
    this.visual.setAttribute('stroke-width', v.toString());

    if (this.isAttached())
      this.board.connectionSnapshotAction.emit(reverse, ConnectionSnapshot.edit(this, 'size'));
  }

  public get size() {
    return this._size;
  }

  public set dash(dash: number[]) {
    if (ConnectionView.isDashEqual(this._dash, dash)) return;
    const reverse = ConnectionSnapshot.edit(this, 'dash');
    this.board.defaultDash = dash;
    this._dash = dash;
    this.updateDash();

    if (this.isAttached())
      this.board.connectionSnapshotAction.emit(reverse, ConnectionSnapshot.edit(this, 'dash'));
  }

  public get dash() {
    return this._dash;
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
    const visual = this.visual;
    const a = this.a.dots[this.pa].getBoundingClientRect();
    const b = this.b.dots[this.pb].getBoundingClientRect();
    const scl = this.board.scale;
    view.x1.baseVal.value = visual.x1.baseVal.value = (a.x + a.width / 2) / scl - this.board.dx;
    view.y1.baseVal.value = visual.y1.baseVal.value = (a.y + a.height / 2) / scl - this.board.dy;
    view.x2.baseVal.value = visual.x2.baseVal.value = (b.x + b.width / 2) / scl - this.board.dx;
    view.y2.baseVal.value = visual.y2.baseVal.value = (b.y + b.height / 2) / scl - this.board.dy;
  }

  public static isDashEqual(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] != b[i]) {
        return false;
      }
    }
    return true;
  }

  public static getMatchingStyle(connections: ConnectionView[]) {
    if (connections.length === 0) return undefined;
    let color: string | undefined = connections[0].color;
    let size: number | undefined = connections[0].size;
    let dash: number[] | undefined = connections[0].dash;

    for (let i = 1; i < connections.length; i++) {
      const currColor = connections[i].color;
      const currSize = connections[i].size;
      const currDash = connections[i].dash;
      if (currColor !== color) {
        color = undefined;
      }
      if (currSize !== size) {
        size = undefined;
      }
      if (dash && !ConnectionView.isDashEqual(currDash, dash)) {
        dash = undefined;
      }
    }
    if (color === undefined && size === undefined && dash === undefined) {
      return undefined;
    }
    return {
      color,
      size,
      dash,
    };
  }

  get rect() {
    return {
      l: Math.min(this.view.x1.baseVal.value, this.view.x2.baseVal.value),
      t: Math.min(this.view.y1.baseVal.value, this.view.y2.baseVal.value),
      r: Math.max(this.view.x1.baseVal.value, this.view.x2.baseVal.value),
      b: Math.max(this.view.y1.baseVal.value, this.view.y2.baseVal.value),
    }
  }
}

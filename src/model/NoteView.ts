import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from "@/utils/PointerHandler";
import type { BoardView } from "./BoardView";
import { ConnPosition, type ConnectionView } from "./ConnectionView";
import { div } from "./helper";
import TypedEventListener from "@/utils/TypedEventListener";
import type { StoredImage } from "./StoredImage";
import { SACreateNote } from "@/snapshot/SACreateNote";
import { SADeleteNote } from "@/snapshot/SADeleteNote";
import { SAEditNote } from "@/snapshot/SAEditNote";

function setPos(pos: ConnPosition) {
  return (el: HTMLElement) => {
    el.dataset['pos'] = pos.toString();
  }
}

export class NoteView {
  private viewRoot;
  private viewContent;
  private viewImage;
  private pointerHandler;
  private dotPointerHandlers: PointerHandler[];

  private dragFrom = null! as string;

  public readonly beforeDetached = new TypedEventListener<NoteView>();
  public readonly clicked = new TypedEventListener<NoteView>();
  public readonly dots: HTMLElement[] = [];
  public readonly conn = new Map<number, ConnectionView>;

  constructor(
    private board: BoardView,
    public readonly id: number,
    private _x: number,
    private _y: number,
    private _text: string = '',
    private _img: StoredImage | null = null,
  ) {
    this.viewImage = document.createElement('img');
    this.viewRoot = div('note',
      div('container',
        this.viewImage,
        this.viewContent = div('content'),
        this.dots[0] = div('dot', setPos(ConnPosition.left)),
        this.dots[1] = div('dot', setPos(ConnPosition.top)),
        this.dots[2] = div('dot', setPos(ConnPosition.right)),
        this.dots[3] = div('dot', setPos(ConnPosition.bottom)),
      )
    );

    this.viewImage.onload = () => {
      this.updatePosition();
    }

    this.pointerHandler = new PointerHandler({
      onmove: this.onPointerMove,
      onclick: this.onPointerClick,
      stopPropagation: true,
      instance: this,
    });

    this.dotPointerHandlers = [];
    for (let i = 0; i < 4; i++) {
      this.dotPointerHandlers.push(new PointerHandler({
        onstart: this.onStartDragDot,
        onend: this.onEndDragDot,
        stopPropagation: true,
        instance: this,
      }));
    }

    this.text = _text;
    this.img = _img;
    this.viewRoot.dataset['id'] = id.toString();

    board.snapshot.push(new SACreateNote(this));
  }

  public attach(dst: HTMLElement) {
    dst.appendChild(this.viewRoot);
    if (this.board.editable) {
      this.pointerHandler.attach(this.viewRoot, dst);
      for (let i = 0; i < 4; i++) {
        this.dotPointerHandlers[i].attach(this.dots[i], dst);
      }
    }
  }

  public detach() {
    if (!this.isAttached()) return;
    this.beforeDetached.emit(this);
    this.viewRoot.parentElement!.removeChild(this.viewRoot);
    if (this.board.editable) {
      this.pointerHandler.detach();
      for (const dotPointerHandler of this.dotPointerHandlers) {
        dotPointerHandler.detach();
      }
    }
  }

  public isAttached() {
    return this.viewRoot.parentElement !== null;
  }

  public destroy() {
    this.board.snapshot.push(new SADeleteNote(this));
    for (const conn of this.conn.values()) {
      conn.destroy();
    }
    const i = this.board.notes.indexOf(this);
    this.board.notes.splice(i, 1);
    this.board.noteMap.delete(this.id);
    this.detach();
  }

  public highlight(highlight = true) {
    if (highlight) {
      this.viewRoot.classList.add('highlight');
    } else {
      this.viewRoot.classList.remove('highlight');
    }
  }

  public get x() {
    return this._x;
  }

  public get y() {
    return this._y;
  }

  public get text() {
    return this._text;
  }

  public set img(img: StoredImage | null) {
    this._img = img;
    if (img) {
      this.viewImage.src = img.fullPath;
    } else {
      this.viewImage.removeAttribute('src')
      this.updatePosition();
    }

    if (this.isAttached())
      this.board.snapshot.push(new SAEditNote(this, ['img']));
  }

  public get img() {
    return this._img;
  }

  public set text(text: string) {
    this._text = text;
    this.viewContent.innerHTML = text;
    this.updatePosition();

    if (this.isAttached())
      this.board.snapshot.push(new SAEditNote(this, ['text']));
  }

  private onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
    this._x += e.dx;
    this._y += e.dy;
    this.updatePosition();

    this.board.snapshot.push(new SAEditNote(this, ['x', 'y']));
  }

  private onStartDragDot(e: GenericPointerEvent, px: number, py: number) {
    const target = e.target as HTMLElement;
    this.dragFrom = target.dataset['pos']!;
  }
  
  private onEndDragDot(e: GenericPointerEvent, px: number, py: number) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('dot')) {
      return;
    }
    const dragToId = parseInt(target.parentElement!.parentElement!.dataset['id']!);
    const dragToPos = target.dataset['pos']!;
    if (this.id === dragToId) {
      return
    }
    if (this.board.isConnected(this, dragToId)) {
      return;
    }
    this.board.newConnection(this, parseInt(this.dragFrom), dragToId, parseInt(dragToPos));
  }

  public onPointerClick(e: GenericPointerEvent) {
    e.preventDefault();
    this.clicked.emit(this);
  }

  private updatePosition() {
    this.viewRoot.style.setProperty('--x', this._x + 'px');
    this.viewRoot.style.setProperty('--y', this._y + 'px');
    for (const c of this.conn.values()) {
      c.updateView();
    }
  }
}

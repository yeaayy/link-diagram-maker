import NoteSnapshot from "@/snapshot/NoteSnapshot";
import PointerHandler, { type GenericPointerEvent, type PointerMoveEvent } from "@/utils/PointerHandler";
import TypedEventListener from "@/utils/TypedEventListener";
import type { BoardView } from "./BoardView";
import { ConnPosition, type ConnectionView } from "./ConnectionView";
import type { StoredImage } from "./StoredImage";
import { div } from "./helper";

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

  private dragFrom = null! as number;
  private drawPreview: null | SVGLineElement = null;

  public readonly beforeDetached = new TypedEventListener<NoteView>();
  public readonly clicked = new TypedEventListener<NoteView>();
  public readonly startDrag = new TypedEventListener<NoteView>();
  public readonly dragging = new TypedEventListener<[NoteView, dx: number, dy: number]>();
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
      onstart: this.onPointerStart,
      onmove: this.onPointerMove,
      onclick: this.onPointerClick,
      stopPropagation: true,
      instance: this,
    });

    this.dotPointerHandlers = [];
    for (let i = 0; i < 4; i++) {
      this.dotPointerHandlers.push(new PointerHandler({
        onstart: this.onStartDragDot,
        onmove: this.onDraggingDot,
        onend: this.onEndDragDot,
        stopPropagation: true,
        instance: this,
      }));
    }

    this.text = _text;
    this.img = _img;
    this.viewRoot.dataset['id'] = id.toString();

    board.snapshot.pushNoteSnapshotAction(NoteSnapshot.create(this));
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
    for (const conn of this.conn.values()) {
      conn.destroy();
    }
    this.img = null;
    const i = this.board.notes.indexOf(this);
    this.board.notes.splice(i, 1);
    this.board.noteMap.delete(this.id);
    this.detach();
    this.board.snapshot.pushNoteSnapshotAction(NoteSnapshot.delete(this));
  }

  public highlight(highlight = true) {
    if (highlight) {
      this.viewRoot.classList.add('highlight');
    } else {
      this.viewRoot.classList.remove('highlight');
    }
  }

  public move(dx: number, dy: number) {
    this._x += dx;
    this._y += dy;
    this.updatePosition();

    this.board.snapshot.pushNoteSnapshotAction(NoteSnapshot.edit(this, 'x', 'y'));
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
    if (this._img) {
      this._img.destroyed.remove(this.onImageDestroyed, this);
    }
    if (img) {
      img.destroyed.listen(this.onImageDestroyed, this);
      this.viewImage.src = img.fullPath;
    } else {
      this.viewImage.removeAttribute('src')
      this.updatePosition();
    }

    if (this._img !== img) {
      this._img = img;

      if (this.isAttached()) {
        this.board.snapshot.pushNoteSnapshotAction(NoteSnapshot.edit(this, 'img'));
      }
    }
  }

  public get img() {
    return this._img;
  }

  public set text(text: string) {
    this._text = text;
    if (text.length == 0) {
      this.viewContent.classList.add('empty');
    } else {
      this.viewContent.classList.remove('empty');
      this.viewContent.innerHTML = text;
    }
    this.updatePosition();

    if (this.isAttached())
      this.board.snapshot.pushNoteSnapshotAction(NoteSnapshot.edit(this, 'text'));
  }

  private onImageDestroyed(img: StoredImage) {
    this.img = null;
  }

  private onPointerStart(ev: GenericPointerEvent, x: number, y: number) {
    this.startDrag.emit(this);
  }

  private onPointerMove(ev: GenericPointerEvent, e: PointerMoveEvent) {
    this.dragging.emit(this, e.dx / this.board.scale, e.dy / this.board.scale);
  }

  private onStartDragDot(e: GenericPointerEvent, px: number, py: number) {
    const target = e.target as HTMLElement;
    this.dragFrom = parseInt(target.dataset['pos']!);
    document.body.classList.add('dragging-dot');
    this.board.previewConnection.emit(this.dots[this.dragFrom], px, py);
    for (const dot of this.dots) {
      dot.style.opacity = '0';
    }
  }

  private onDraggingDot(ev: GenericPointerEvent, e: PointerMoveEvent) {
    this.board.previewConnection.emit(this.dots[this.dragFrom], e.px, e.py);
  }
  
  private onEndDragDot(e: GenericPointerEvent, px: number, py: number) {
    document.body.classList.remove('dragging-dot');
    for (const dot of this.dots) {
      dot.style.removeProperty('opacity');
    }
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
    this.board.newConnection(this, this.dragFrom, dragToId, parseInt(dragToPos));
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

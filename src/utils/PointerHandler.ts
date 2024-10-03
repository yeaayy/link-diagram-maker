import Rect from "@/math/Rect";

export type GenericPointerEvent = TouchEvent | MouseEvent;
type OnHandlePointer = (e: GenericPointerEvent, px: number, py: number) => void;
export type PointerMoveEvent = { px: number, py: number, dx: number, dy: number, ax: number, ay: number };
type OnMoveHandler = (e: GenericPointerEvent, p: PointerMoveEvent) => void;

export type PointerHandlerOpt = {
  onstart?: OnHandlePointer;
  onmove?: OnMoveHandler;
  onend?: OnHandlePointer;
  onclick?: OnHandlePointer;
  onidle?: OnHandlePointer;
  instance?: unknown;
  stopPropagation?: boolean;
}

export default class PointerHandler {
  public instance?: unknown;
  public onstart?: OnHandlePointer;
  public onmove?: OnMoveHandler;
  public onend?: OnHandlePointer;
  public onclick?: OnHandlePointer;
  public onidle?: OnHandlePointer;

  private validClick = false;
  private isPointerDown = false;
  private sx = 0;
  private sy = 0;
  private lx = 0;
  private ly = 0;
  private map;
  private el: Element | undefined;
  private ref: Element | undefined;
  private refBBox: DOMRect = null! as DOMRect;
  private stopPropagation?: boolean;

  constructor(opt?: PointerHandlerOpt) {
    if (opt) {
      this.onstart = opt.onstart;
      this.onmove = opt.onmove;
      this.onend = opt.onend;
      this.onclick = opt.onclick;
      this.onidle = opt.onidle;
      this.instance = opt.instance;
      this.stopPropagation = opt.stopPropagation;
    }
    this.map = {
      mousedown: this.onMouseDown,
      mousemove: this.onMouseMove,
      mouseup: this.onMouseUp,
      touchstart: this.onTouchStart,
      touchmove: this.onTouchMove,
      touchend: this.onTouchEnd,
    }
  }

  public attach(el: Element, ref?: Element) {
    this.el = el;
    this.ref = ref ?? el;
    el.addEventListener('touchstart', this);
    el.addEventListener('mousedown', this);
    if (this.onidle) {
      window.addEventListener('mousemove', this);
    }
    return this;
  }

  public detach() {
    this.el!.removeEventListener('touchstart', this);
    this.el!.removeEventListener('mousedown', this);
    if (this.onidle) {
      window.removeEventListener('mousemove', this);
    }
    this.el = undefined;
    this.ref = undefined;
  }

  private pointerStart(e: GenericPointerEvent, x: number, y: number) {
    this.refBBox = this.ref!.getBoundingClientRect();
    x -= this.refBBox.x;
    y -= this.refBBox.y;

    this.lx = this.sx = x;
    this.ly = this.sy = y;
    if (this.stopPropagation) {
      e.stopPropagation();
    }
    if (this.onstart) {
      this.onstart.call(this.instance, e, x, y);
    }
    this.validClick = true;
  }

  private pointerMove(e: GenericPointerEvent, x: number, y: number) {
    x -= this.refBBox.x;
    y -= this.refBBox.y;
    const
      ax = x - this.sx,
      ay = y - this.sy;
    if (this.onmove) {
      this.onmove.call(this.instance, e, {
        px: x,
        py: y,
        dx: x - this.lx,
        dy: y - this.ly,
        ax,
        ay,
      });
    }
    this.lx = x;
    this.ly = y;
    if (this.validClick && Math.hypot(ax, ay) > 10) this.validClick = false;
  }

  private pointerIdle(e: GenericPointerEvent, x: number, y: number) {
    if (this.onidle) {
      const refBBox = this.el!.getBoundingClientRect();
      if (!Rect.isPointInsideRectFF(x, y, refBBox.x, refBBox.y, refBBox.width, refBBox.height))
        return;
      x -= refBBox.x;
      y -= refBBox.y;
      this.onidle.call(this.instance, e, x, y);
    }
  }

  private pointerEnd(e: GenericPointerEvent, x: number, y: number) {
    x -= this.refBBox.x;
    y -= this.refBBox.y;
    if (this.onend) {
      this.onend.call(this.instance, e, x, y);
    }
    if (this.validClick && this.onclick) {
      this.onclick.call(this.instance, e, x, y);
    }
    e.preventDefault();
  }

  private onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.pointerStart(e, touch.clientX, touch.clientY);
    window.addEventListener('touchmove', this);
    window.addEventListener('touchend', this);
  }

  private onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    this.pointerMove(e, touch.clientX, touch.clientY);
  }

  private onTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    this.pointerEnd(e, touch.clientX, touch.clientY);
    window.removeEventListener('touchmove', this);
    window.removeEventListener('touchend', this);
  }

  private onMouseDown(e: MouseEvent) {
    this.isPointerDown = true;
    this.pointerStart(e, e.clientX, e.clientY);
    if (!this.onidle) {
      window.addEventListener('mousemove', this);
    }
    window.addEventListener('mouseup', this);
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isPointerDown) {
      this.pointerMove(e, e.clientX, e.clientY);
    } else if (this.onidle) {
      this.pointerIdle(e, e.clientX, e.clientY)
    }
  }

  private onMouseUp(e: MouseEvent) {
    this.isPointerDown = false;
    this.pointerEnd(e, e.clientX, e.clientY);
    if (!this.onidle) {
      window.removeEventListener('mousemove', this);
    }
    window.removeEventListener('mouseup', this);
  }

  public handleEvent(e: Event) {
    // @ts-ignore
    this.map[e.type].call(this, e);
  }

}

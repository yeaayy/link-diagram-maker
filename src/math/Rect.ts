
export type RectType = {
  readonly l: number;
  readonly t: number;
  readonly r: number;
  readonly b: number;
}

export default class Rect {
  public l: number;
  public t: number;
  public r: number;
  public b: number;

  constructor(src: RectType);
  constructor(x: number, y: number);
  constructor(l: number, t: number, r: number, b: number);

  constructor(
    l: number | RectType,
    t?: number,
    r?: number,
    b?: number,
  ) {
    if (typeof(l) !== 'number') {
      this.l = l.l;
      this.t = l.t;
      this.r = l.r;
      this.b = l.b;
    } else if (t === undefined) {
      throw new Error();
    } else if (r !== undefined && b !== undefined) {
      this.l = l;
      this.t = t;
      this.r = r;
      this.b = b;
    } else {
      this.l = this.r = l;
      this.t = this.b = t;
    }
  }

  get x() {
    return this.l;
  }

  get y() {
    return this.t;
  }

  get width() {
    return this.r - this.l;
  }

  get height() {
    return this.b - this.t;
  }

  public isInside(x: number, y: number) {
    if (x >= this.l && x <= this.r &&
      y >= this.t && y <= this.b) {
      return true;
    }
    return false;
  }

  /**
   * Check if `rect` is inside this rect.
   * @param rect 
   */
  public isRectInside(rect: RectType) {
    return Rect.isRectInsideRectRR(rect, this);
  }

  public unionWithPointF(x: number, y: number) {
    this.l = Math.min(this.l, x);
    this.t = Math.min(this.t, y);
    this.r = Math.max(this.r, x);
    this.b = Math.max(this.b, y);
    return this;
  }

  public unionWithRectF(l: number, t: number, r: number, b: number) {
    this.l = Math.min(this.l, l);
    this.t = Math.min(this.t, t);
    this.r = Math.max(this.r, r);
    this.b = Math.max(this.b, b);
    return this;
  }

  public unionWithRect(other: RectType) {
    this.l = Math.min(this.l, other.l);
    this.t = Math.min(this.t, other.t);
    this.r = Math.max(this.r, other.r);
    this.b = Math.max(this.b, other.b);
    return this;
  }

  public expand(amount: number) {
    this.l -= amount;
    this.t -= amount;
    this.r += amount;
    this.b += amount;
    return this;
  }

  public static isPointInsideRectFF(
    px: number,
    py: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number,
  ) {
    return px >= rectX && px <= (rectX + rectWidth) &&
      py >= rectY && py <= (rectY + rectHeight);
  }

  public static isPointInsideRectFR(
    px: number,
    py: number,
    rect: Rect,
  ) {
    return Rect.isPointInsideRectFF(px, py, rect.x, rect.y, rect.width, rect.height)
  }

  /** Check if `a` is inside `b` */
  public static isRectInsideRectRR(a: RectType, b: RectType) {
    return b.l <= a.l && a.r <= b.r &&
           b.t <= a.t && a.b <= b.b;
  }
}

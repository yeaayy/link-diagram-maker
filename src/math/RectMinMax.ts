
export default class RectMinMax {
  public x1: number;
  public y1: number;
  public x2: number;
  public y2: number;

  constructor(x: number, y: number);
  constructor(x1: number, y1: number, x2: number, y2: number);

  constructor(
    x1: number | RectMinMax,
    y1?: number,
    x2?: number,
    y2?: number,
  ) {
    if (x1 instanceof Object) {
      this.x1 = x1.x1;
      this.y1 = x1.y1;
      this.x2 = x1.x2;
      this.y2 = x1.y2;
    } else if (y1 === undefined) {
      throw new Error();
    } else if (x2 !== undefined && y2 !== undefined) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    } else {
      this.x1 = this.x2 = x1;
      this.y1 = this.y2 = y1;
    }
  }

  get width() {
    return Math.abs(this.x1 - this.x2)
  }

  get height() {
    return Math.abs(this.y1 - this.y2)
  }

  get l() {
    return Math.min(this.x1, this.x2);
  }

  get r() {
    return Math.max(this.x1, this.x2);
  }

  get t() {
    return Math.min(this.y1, this.y2);
  }

  get b() {
    return Math.max(this.y1, this.y2);
  }
}

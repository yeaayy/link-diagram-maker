import TypedEventListener from "@/utils/TypedEventListener";

export class StoredImage{
  public readonly destroyed = new TypedEventListener<StoredImage>();

  constructor(
    public readonly path: string,
    public id?: any,
    public name?: string,
    public hash?: string,
  ) {}

  get fullPath() {
    return './img/' + this.path;
  }

  destroy() {
    this.destroyed.emit(this);
  }
}

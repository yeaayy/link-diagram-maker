
export class StoredImage{
  constructor(
    public readonly id: any,
    public readonly path: string,
    public readonly name: string,
  ) {}

  get fullPath() {
    return '../img/' + this.path;
  }
}

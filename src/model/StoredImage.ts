
export class StoredImage{
  constructor(
    public readonly path: string,
    public id?: any,
    public name?: string,
    public hash?: string,
  ) {}

  get fullPath() {
    return './img/' + this.path;
  }
}

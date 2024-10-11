import TypedEventListener from "./TypedEventListener";

type DragEventNames = 'dragenter' | 'dragover' | 'dragleave' | 'drop';

export class DropArea {
  public readonly dropped = new TypedEventListener<[file: File, e: DragEvent]>;
  private target: HTMLElement = null!;
  private map;

  constructor(
    private accept: string | ((ext: string) => boolean),
  ) {
    this.map = {
      dragenter: this.onDragEnter,
      dragover: this.onDragEnter,
      dragleave: this.onDragLeave,
      drop: this.onDrop,
    };
  }

  private onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.target.classList.add('dropping');
  }

  private onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.target.classList.remove('dropping');
  }

  private onDrop(e: DragEvent) {
    this.onDragLeave(e);
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return
    for (const file of dataTransfer.files) {
      if (typeof this.accept === 'function') {
        if (!this.accept(file.type)) continue;
      } else {
        if (!file.type.startsWith(this.accept)) continue;
      }
      this.dropped.emit(file, e);
    }
  }

  public attach(target: HTMLElement) {
    this.target = target;
    target.addEventListener('dragenter', this);
    target.addEventListener('dragover', this);
    target.addEventListener('dragleave', this);
    target.addEventListener('drop', this);
  }

  public isAttached() {
    return this.target != null;
  }

  public detach() {
    this.target.removeEventListener('dragenter', this);
    this.target.removeEventListener('dragover', this);
    this.target.removeEventListener('dragleave', this);
    this.target.removeEventListener('drop', this);
    this.target = null!;
  }

  public handleEvent(e: Event) {
    this.map[e.type as DragEventNames].call(this, e as DragEvent);
  }
}

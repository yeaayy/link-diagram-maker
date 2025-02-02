
export default class TriggerOnce {
  private timeout: NodeJS.Timeout | null = null;
  private promise: Promise<void> | null = null;
  private resolve: null | (() => void) = null;

  constructor(
    private listener: ()=>void,
    private instance?: unknown
  ) {}

  trigger() {
    if (this.timeout) return;

    this.timeout = setTimeout(() => {
      this.listener.call(this.instance);
      this.timeout = null;
      if (this.resolve) {
        this.resolve();
        this.promise = null;
        this.resolve = null;
      }
    });
  }

  async wait() {
    if (!this.timeout) return;
    if (!this.promise) {
      this.promise = new Promise((resolve: () => void) => this.resolve = resolve);
    }
    await this.promise;
  }
}

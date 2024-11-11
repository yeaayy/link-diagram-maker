import TypedEventListener from "./TypedEventListener";

export class Key<T> {
  public names: string[];
  public _default: () => T;

  constructor(_default: T | (() => T), ...names: string[]) {
    this.names = names;
    this._default = _default instanceof Function
      ? _default
      : () => _default;
  }
}

export class KeyGroup {
  public names: string[];
  private constructor(...names: string[]) {
    this.names = names;
  }

  public subGroup(name: string) {
    return new KeyGroup(...this.names, name);
  }

  public key<T>(name: string, _default: T | (() => T)) {
    return new Key(_default, ...this.names, name);
  }

  public static new(...names: string[]) {
    return new KeyGroup(...names);
  }
}

export class Settings {
  public readonly beforeSave = new TypedEventListener<void>();
  private data: {
    [key: string]: any;
  };
  private name: string;

  public constructor(name: string) {
    this.name = name;
    this.data = JSON.parse(localStorage.getItem(name) ?? '{}');
    window.addEventListener('unload', () => this.save());
  }

  public get<T>(key: Key<T>): T {
    let data = this.data;
    let i = 0;
    for (; i < key.names.length - 1; i++) {
      const name = key.names[i]
      if (data[name] === undefined) {
        data[name] = {};
      }
      data = data[name];
    }

    const name = key.names[i];
    if (data[name] === undefined) {
      data[name] = key._default();
    }
    return data[name];
  }

  public set<T>(key: Key<T>, value: T) {
    let data = this.data;
    let i = 0;
    for (; i < key.names.length - 1; i++) {
      const name = key.names[i]
      if (data[name] === undefined) {
        data[name] = {};
      }
      data = data[name];
    }

    data[key.names[i]] = value;
    return value;
  }

  public reset<T>(key: Key<T>): T {
    return this.set(key, key._default());
  }

  public save() {
    this.beforeSave.emit();
    localStorage.setItem(this.name, JSON.stringify(this.data));
  }

}


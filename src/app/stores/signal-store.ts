import { Signal, WritableSignal, signal } from '@angular/core';

type State<T> = {
  [Key in keyof T]: WritableSignal<T[Key]>;
};

type SignalState<T> = {
  readonly [Key in keyof T]: Signal<T[Key]>;
};

export abstract class SignalStore<T extends {}> {
  private initState: T;
  protected state: State<T>;

  constructor(initState: Required<T>) {
    this.initState = initState;
    this.state = this.createSignalState(initState);

    for (const key of this.getKeys(initState)) {
      (this as any)[key] = this.state[key].asReadonly();
    }
  }

  reset() {
    this.setState(this.initState);
  }

  toSignalStore(): this & SignalState<T> {
    return this as any;
  }

  // protected select<K extends keyof T>(key: K): Signal<T[K]> {
  //   return this.state[key].asReadonly();
  // }

  protected setState(newState: Partial<T>) {
    this.getKeys(newState).forEach((k) => {
      this.state[k].set(newState[k]!);
    });
  }

  private createSignalState(value: T) {
    const state = {} as State<T>;
    for (const key of this.getKeys(value)) {
      state[key] = signal(value[key]);
    }
    return state;
  }

  private getKeys<T>(value: T & object) {
    return Object.keys(value) as Array<keyof T>;
  }
}

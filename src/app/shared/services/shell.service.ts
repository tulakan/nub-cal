import { Injectable, Signal, signal } from '@angular/core';

export interface HeaderAction {
  icon?: string;
  label?: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: Signal<boolean>;
}

/** Lets pages contribute header actions without template portals. */
@Injectable({ providedIn: 'root' })
export class ShellService {
  readonly actions = signal<HeaderAction[]>([]);
  readonly subtitle = signal<string>('');

  set(actions: HeaderAction[], subtitle = '') {
    this.actions.set(actions);
    this.subtitle.set(subtitle);
  }

  clear() {
    this.actions.set([]);
    this.subtitle.set('');
  }
}

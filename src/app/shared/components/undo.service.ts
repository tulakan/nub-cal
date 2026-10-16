import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class UndoService {
  private snack = inject(MatSnackBar);

  notify(message: string) {
    this.snack.open(message, undefined, { duration: 2500 });
  }

  /** Shows `message` with an Undo action that runs `revert`. */
  undoable(message: string, revert: () => void) {
    this.snack
      .open(message, 'Undo', { duration: 4000 })
      .onAction()
      .subscribe(() => revert());
  }

  /** Applies immediately; Undo calls revert. */
  remove(opts: { label: string; apply: () => void; revert: () => void }) {
    opts.apply();
    this.undoable(`${opts.label} removed`, opts.revert);
  }
}

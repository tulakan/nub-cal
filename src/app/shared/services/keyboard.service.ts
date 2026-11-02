import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const NON_TEXT = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'range',
  'file',
  'color',
]);
const FIELDS =
  'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

const isTextField = (el: EventTarget | null): el is HTMLElement =>
  el instanceof HTMLTextAreaElement ||
  (el instanceof HTMLInputElement && !NON_TEXT.has(el.type));

/**
 * Keeps forms usable while the on-screen keyboard is open:
 * - `kb-open` on <html> while a text field has focus (CSS hides the nav, FAB
 *   and fixed bars so they do not float above the keyboard)
 * - `--kb-inset` from the visual viewport, for browsers that overlay the
 *   keyboard instead of resizing the layout (iOS Safari)
 * - scrolls the focused field into view
 * - Enter on a field with enterkeyhint="next" moves to the next field,
 *   enterkeyhint="done" closes the keyboard
 */
@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private doc = inject(DOCUMENT);
  private root = this.doc.documentElement;
  private blurTimer: ReturnType<typeof setTimeout> | undefined;

  start() {
    const doc = this.doc;
    doc.addEventListener('focusin', e => this.onFocusIn(e));
    doc.addEventListener('focusout', () => this.onFocusOut());
    doc.addEventListener('keydown', e => this.onKeyDown(e));

    const vv = doc.defaultView?.visualViewport;
    if (vv) {
      const update = () => {
        const win = doc.defaultView!;
        const inset = Math.max(
          0,
          Math.round(win.innerHeight - vv.height - vv.offsetTop)
        );
        this.root.style.setProperty('--kb-inset', `${inset}px`);
      };
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      update();
    }
  }

  private onFocusIn(e: FocusEvent) {
    if (!isTextField(e.target)) return;
    clearTimeout(this.blurTimer);
    this.root.classList.add('kb-open');
    const el = e.target;
    // wait for the keyboard animation, then keep the field in view
    setTimeout(() => {
      if (this.doc.activeElement === el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 300);
  }

  private onFocusOut() {
    clearTimeout(this.blurTimer);
    // moving between fields fires focusout then focusin: only close if idle
    this.blurTimer = setTimeout(() => {
      if (!isTextField(this.doc.activeElement)) {
        this.root.classList.remove('kb-open');
      }
    }, 120);
  }

  private onKeyDown(e: KeyboardEvent) {
    const el = e.target;
    if (e.key !== 'Enter' || e.isComposing || !(el instanceof HTMLInputElement))
      return;
    const hint = el.enterKeyHint;
    if (hint === 'done') {
      el.blur();
      return;
    }
    if (hint !== 'next') return;
    const scope = el.closest('app-sheet, main, form') ?? this.doc.body;
    const fields = Array.from(scope.querySelectorAll<HTMLElement>(FIELDS));
    const next = fields[fields.indexOf(el) + 1];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  }
}

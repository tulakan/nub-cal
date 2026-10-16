# Nub Cal — UX/UI & PWA Overhaul Plan

> **Implementation status (2026-10-15):** Phases 0–7 implemented in one pass, build verified (dev + prod). **Not yet verified on a real phone** (iOS safe areas, keyboard + sheet behaviour, swipe feel, PWA install). Deviations from this plan are listed in §14.

> **Audience:** AI coding agents (and human reviewers) implementing the redesign.
> **Scope:** UX/UI and PWA shell only. Business logic mostly stays as is. The only functional changes are the small ones listed in §9 that the UX needs, plus the bugs found during the audit.
> **Stack:** Angular 18 (standalone, signals), Angular Material 18 (M2 theme), Angular CDK, Tailwind 3 (preflight off), Firebase (Auth + Firestore), ngx-echarts, Firebase Hosting (`public/` is the **build output**. Never put source files there).

---

## 0. สรุปสำหรับเจ้าของโปรเจกต์ (Thai summary)

- เปลี่ยนเป็น PWA ที่ติดตั้งลงมือถือได้ (manifest, icon, service worker, safe-area, ใช้งาน offline ได้บางส่วน)
- ลด bottom nav จาก 5 เป็น 4 แท็บ: **Today / Plan / Foods / Progress** (รวม Body Composition กับ Circumference เข้าเป็นหน้าเดียว) และมี label ใต้ไอคอน
- หน้า Today: ตารางตัวเลขเปลี่ยนเป็น “แคลอรี่คงเหลือ” ตัวใหญ่ + แถบ P/C/F ที่อ่านได้ในครั้งเดียว ใช้คำว่า “เหลือ / เกิน” แทนเครื่องหมาย +/- ที่ทำให้สับสน
- การเพิ่มอาหารเปลี่ยนจาก dialog เป็น bottom sheet: ค้นหา → แตะ → ปรับปริมาณ → เพิ่ม (3 แตะ) มีรายการ “ล่าสุด” และปุ่มลัดปริมาณ
- ลบแบบปัดซ้าย + Undo ทุกที่ (เลิกใช้ `confirm()` ของเบราว์เซอร์)
- ฟีเจอร์ Menu / Meal Plan ยังไม่สมบูรณ์ (ดู §Phase 3 ข้อ 3.0, M1–M16) ปัญหาหลักคือยังไม่มีทางนำเมนูหรือแผนไปบันทึกลง Food Log ได้เลย แผนจะทำให้ครบวงจร: สร้างเมนู → วางแผนวันนี้ (บันทึกไม่หาย, ปรับ ½/1/2 เท่าได้) → บันทึกลง Today ทั้งแผนหรือทีละเมนู → Today แสดงเป็นกลุ่มเมนู กดขยายดูวัตถุดิบได้
- แก้บั๊กที่เจอระหว่าง audit (ดู §8) โดยเฉพาะ `seedData()` ที่ถูกเรียกทุกครั้งที่เปิดหน้า และค่า progress ที่คำนวณจาก index ผิด
- ทำเป็นลำดับ Phase 0 → 6 แต่ละ task มีรายการไฟล์และเกณฑ์ “เสร็จเมื่อ” ชัดเจน เพื่อให้ agent ตัวอื่นทำต่อได้ทีละชิ้น

---

## 1. Rules for agents (read first)

1. Read `AGENTS.md` and `.impeccable.md` before touching any UI. This plan **amends** `.impeccable.md` in Phase 0. Apply that amendment first, and treat the updated file as the source of truth.
2. Work **one task at a time**, in phase order. Tasks inside a phase can run in parallel unless they list a `Depends on:` line.
3. After each task, run `npm run build`. It must pass with no new errors, and the `anyComponentStyle` budget (15 kB warn) must hold. Then check the UI in Chrome DevTools at **375×667** and **390×844**.
4. Do **not** change Firestore schema, collection names, or `localStorage` keys unless a task says so. When a task does, it includes a migration.
5. Headings: use `div` with type classes, not `h1`–`h6` (AGENTS.md rule 5).
6. Styling: component SCSS + CSS custom properties. Use Tailwind **only** for layout utilities (`flex`, `grid`, `gap-*`, `w-full`) in templates, and never mix Tailwind and SCSS for the same concern. Do not use `@apply` in new code.
7. Every icon-only button needs an `aria-label`. Every tappable element must be a `<button>` or `<a>` (no `div (click)`), with a hit area of at least 44×44px.
8. Commit per task with a conventional commit message (`feat(ui): …`, `fix: …`).
9. Don't over-design. Monochrome, flat, dense, as `.impeccable.md` describes. If a task is unclear, pick the simpler option and leave a note in the PR.

---

## 2. Audit — what's wrong today

### 2.1 Shell / PWA
| # | Problem | Where |
|---|---------|-------|
| S1 | Not a PWA: no manifest, no service worker, no icons, no `theme-color`, title is "PersonalApp" | `src/index.html`, `angular.json` |
| S2 | No safe-area handling, so the bottom nav sits under the iOS home indicator, and `height:100%` jumps when the URL bar shows or hides | `main.component.ts`, `styles.scss` |
| S3 | Bottom nav has 5 icon-only buttons, no labels, and **no active state**, so users can't tell where they are | `main.component.ts` |
| S4 | Page title comes from `router.url.includes()` string matching | `main.component.ts` |
| S5 | Roboto is loaded at 300/400/500, but the design uses 600/700, so the browser fakes bold | `index.html` |
| S6 | Inputs use font sizes below 16px, so iOS Safari **zooms the page on focus** | all forms |
| S7 | `.content-container { overflow-y: scroll }` always shows a scrollbar track, and there's no `overscroll-behavior` (pull-to-refresh bounce fights the custom pull-to-refresh in Plan) | `main.component.ts` |
| S8 | Tailwind `primary` palette is still green, which conflicts with the monochrome theme | `tailwind.config.js` |
| S9 | Unused dark-theme service and theme demo | `theme.service.ts`, `theme-demo.component.ts` |

### 2.2 Cross-cutting
| # | Problem |
|---|---------|
| X1 | Dialogs are centered modals with mixed sizes (`90vh`, `80vh`, `500px`, `700px`). On a phone, bottom sheets are the right pattern. |
| X2 | `dialog-layout`: the title uses an undefined `var(--primary)`; **Cancel is a red warn button** (wrong hierarchy); fixed `w-28` buttons; the close icon is a bare `mat-icon` (24px target, not a button). |
| X3 | Three different delete patterns: native `confirm()` (Food List, Food Log clear-all), tap-to-expand then a red button then a confirm dialog (Food Log), and a custom touch-swipe (Plan). The Plan swipe is inverted and buggy. Menus delete from Firestore **with no confirm and no undo**. |
| X4 | Snackbar "Undo" on Food Log does nothing. Snackbars also appear over the bottom nav. |
| X5 | Contrast: `--c-gray-400 #999` on white is 2.8:1, and `--c-positive #22c55e` text on white is about 2.3:1. Both fail WCAG for text. |
| X6 | Number formatting is inconsistent (`1.1-1`, `1.0-1`, raw floats like `33.333333`, "kcal" with or without a space). |
| X7 | Copy mixes Thai placeholders ("ค้นหาเมนู...") with English UI. |
| X8 | Emoji used as icons (🎯💪🌾🥑🔥), which is off-brand. |
| X9 | Spinners everywhere, no skeletons. Full-screen spinner overlay on Progress. |

### 2.3 Per screen
**Food Log (Today)**
- A 5-column table (Target / Consumed / Remaining) takes 3 reads to answer one question: "how much can I still eat?"
- The `+` sign means "remaining", which reads like "over" (the code even has a `todo: swap +/- Sign`).
- Settings is a 28px `div` icon. The "Add" action is a small icon in the card header, not reachable with a thumb.
- Item row: `"350 kcal | 20g protein | 30g carb | 5g fat"` is long and wraps. kcal isn't right-aligned, so you can't scan it.
- "Delete All Logged Foods" is a full-width red button that's always visible at the bottom, with high risk of accidental taps.
- There's no date or day concept. The log is one undated list in `localStorage`.

**Add Food dialog**
- Autocomplete dropdown on top of a dialog on top of the keyboard leaves very little visible space.
- Serving size defaults to `1` even when the unit is `g`, so the user always has to retype it.
- The "After adding" section takes about 60% of the dialog for 4 numbers plus emoji.
- No recent or frequent foods, so every log starts with typing.

**Menu & Plan**
- The default tab is "Today" (planned menus), which is **not persisted**: leaving the page loses the plan.
- The plan can't be pushed to the Food Log, so users retype what they planned.
- Plan totals aren't compared with the target.
- Menu list shows "N ingredients" instead of kcal and macros, which is what users choose by.
- Custom pull-to-refresh is redundant because the data is realtime, and it checks `window.scrollY`, which is always 0 here, so it hijacks scroll.

**Create / Edit Menu**
- The template is duplicated (page mode and dialog mode). Dialog mode is unused, since `openCreateMenuDialog()` navigates to a route.
- Heavy Tailwind with inline styles. Bottom nav is still visible on a full-screen editing task.
- Ingredient quantity can't be edited after adding. No unsaved-changes guard on back.

**Food List**
- A desktop `mat-table` and a mobile card list are both rendered (CSS-toggled). Duplicate "Add Food" button, FAB, and refresh button. Edit and delete icons on every row add noise.
- Food info form: 7 stacked outline fields, `max="9999"` validation messages, and a unit `mat-select` with 12 options.

**Body Composition / Circumference**
- Two separate nav tabs for one job ("am I progressing?").
- `seedData()` runs on **every** `ngOnInit`. It writes demo data to Firestore if the collection is empty.
- `getProgressDiff()` / `getDateRange()` use index `[1]` as "first", which is off by one.
- Colors: weight going **down** shows red (`negative`), but for a fat-loss user that's good. The good/bad direction depends on the metric.
- The chart has 3 hue-coded series, a legend, and a y-axis name. It's crowded at 375px.
- The add-entry dialog has empty fields every time, even though most values barely change week to week.

**Login**
- No error feedback (only `console.error`), no loading state, no `autocomplete` attributes, `type` isn't `email`.

---

## 3. Target information architecture

```
Bottom nav (4, with labels)
├── Today      /today          (was /food-log, keep a redirect)
│     ├─ sheet: Add food (search → quantity)
│     ├─ sheet: Edit logged item (quantity)
│     └─ sheet: Settings (targets, logout, version)
├── Plan       /plan           (was /menu-plan, keep a redirect)
│     ├─ segment: Plan | Menus
│     ├─ sheet: Pick menu
│     └─ page:  /plan/menu/new , /plan/menu/:id   (full-screen, nav hidden)
├── Foods      /foods          (was /food-list, keep a redirect)
│     └─ sheet: Food form (add/edit)
└── Progress   /progress       (merges /body-composition + /circumference, keep redirects)
      ├─ segment: Body | Measurements
      └─ sheet: Add entry
```

Route `data` drives the shell: `{ title: string, nav: boolean, back?: string }`. Delete `pageTitle` URL matching.

---

## 4. Wireframes (375px)

### 4.1 Today
```
┌─────────────────────────────────────┐
│ Today · Wed 15 Oct            ⚙︎     │ 44px header (+safe-area-top)
├─────────────────────────────────────┤
│        1,240                         │ display, tabular-nums
│        kcal left                     │ caption gray-600
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  760 / 2,000    │ kcal bar (black fill)
│                                      │
│ Protein   ▓▓▓▓▓░░░   62 / 150 g      │ 3 macro rows, body-sm
│ Carbs     ▓▓▓░░░░░   80 / 250 g      │ bar turns negative + "over" text
│ Fat       ▓▓▓▓▓▓▓░   48 / 67 g       │ when > 100%
├─────────────────────────────────────┤
│ Logged · 4                   ⋮       │ section header (⋮ = Clear all)
│ ┌─────────────────────────────────┐ │
│ │ Chicken breast           248    │ │ name body-md · kcal body-md right
│ │ 150 g · P 46 · C 0 · F 5   kcal │ │ meta body-sm gray-600
│ └─────────────────────────────────┘ │ ← swipe left = delete (+Undo)
│ ...                                  │ tap = edit quantity sheet
│                                      │
│                       ┌──────────┐   │
│                       │ + Add    │   │ extended FAB, above nav
│                       └──────────┘   │
├─────────────────────────────────────┤
│  Today    Plan    Foods   Progress   │ 56px + safe-area-bottom, labels
└─────────────────────────────────────┘
```

### 4.2 Add food sheet (two steps, same sheet)
```
Step 1 – pick                         Step 2 – quantity
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ ─── (grabber)            ✕   │      │ ←  Chicken breast         ✕  │
│ 🔍 Search foods…  (autofocus)│      │ 165 kcal per 100 g           │
│ Recent                        │      │                              │
│  Chicken breast   165 /100 g  │      │   [ − ]   150   [ + ]   g    │ 16px+ input, inputmode=decimal
│  Rice, cooked     130 /100 g  │      │  [50] [100] [150] [200]      │ quick chips (multiples of base)
│ All foods                     │      │                              │
│  …                            │      │ 248 kcal · P 46 · C 0 · F 5  │ live preview
│                               │      │ 992 kcal left after this     │ one line, status color if over
│ (top: [ Foods | Menus ] tabs) │      │                              │
│                               │      │ ┌──────────────────────────┐ │
│                               │      │ │      Add · 248 kcal      │ │ sticky primary
└──────────────────────────────┘      └──────────────────────────────┘
```

### 4.3 Plan
```
│ Plan                              │
│ [  Plan  |  Menus  ]              │ segmented
│ Breakfast set              ⋯      │ menu group header (⋯ = remove)
│  Egg            2 pc   [ 2 ]  140 │ inline qty edit, swipe item = remove
│  Toast          1 sl   [ 1 ]   80 │
│ ...                               │
│┌─────────────────────────────────┐│ sticky summary above nav
││ 1,520 kcal · 480 left           ││
││ P 120  C 140  F 50   [Log to Today]│
│└─────────────────────────────────┘│
```

### 4.4 Progress
```
│ Progress                          │
│ [  Body  |  Measurements  ]       │
│ 92.4 kg          −0.6 this week   │ hero + delta chip (good/bad by metric)
│ −7.1 kg since 1 ม.ค. 2569           │
│ [Weight][Fat %][Fat kg][Muscle]   │ metric chips → drive the chart
│ [1M][3M][6M][All]                 │ range chips
│  ╭─╮__ chart (1 series, mono) __  │ 180px tall
│ ┌──────┬──────┬──────┐            │ stat grid 3 cols
│ │ FAT% │MUSCLE│VISC. │            │
│ │ 31.2 │ 34.5 │  12  │            │
│ └──────┴──────┴──────┘            │
│ History                            │
│  15 ต.ค. 2569   92.4 kg · 31.2 %   │ list, newest first
```

---

## 5. Phase 0 — Foundations (do first, blocks everything)

### T0.1 Amend design tokens
**Files:** `.impeccable.md`, `src/styles.scss`
**Do:**
- Add **text-safe status colors** and use them for any status *text*. Keep the existing ones for fills and bars:
  `--c-positive-text: #15803d; --c-negative-text: #b91c1c; --c-warning-text: #b45309;`
- Restrict `--c-gray-400` to icons, placeholders, and disabled states. Muted text uses `--c-gray-600` (5.7:1).
- Add font tokens as CSS vars: `--fs-caption:11px; --fs-body-sm:12px; --fs-body:14px; --fs-subtitle:15px; --fs-title:18px; --fs-display:24px; --fs-hero:32px; --fs-input:16px`.
  - `hero` (32px/700) is **only** for the single big number on Today and Progress.
  - `input` (16px) is **mandatory** for every `<input>`, `<textarea>`, and `<select>` (stops iOS zoom).
- Add layout tokens: `--header-h:44px; --nav-h:56px; --safe-top:env(safe-area-inset-top,0px); --safe-bottom:env(safe-area-inset-bottom,0px)`.
- Add `--fab-offset: calc(var(--nav-h) + var(--safe-bottom) + var(--space-lg))`.
- Update the Bottom Navigation section of `.impeccable.md`: 56px, icon 24px plus a 11px label, active = `--c-black` with weight 600, inactive = `--c-gray-600`.
- Add a "Bottom sheets" and a "Swipe row" pattern section (copy the specs from T1.2 and T1.3).
- Global: `font-variant-numeric: tabular-nums` on numeric values (`.num` utility class).
**Done when:** tokens exist in `:root`, `.impeccable.md` documents them, and the build passes.

### T0.2 Fonts, meta, and global mobile CSS
**Files:** `src/index.html`, `src/styles.scss`, `tailwind.config.js`
**Do:**
- `<html lang="th">`, `<title>Nub Cal</title>`, `viewport` → `width=device-width, initial-scale=1, viewport-fit=cover`.
- Roboto weights `400;500;700` with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`. Map design weight 600 to 500 or 700 consistently (pick **700 for titles and numbers, 500 for names**) and update `.impeccable.md`.
- `html, body { height: 100dvh; overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }`
- `button, a, [matRipple] { touch-action: manipulation; }`
- `input, textarea, select, .mat-mdc-input-element { font-size: var(--fs-input) !important; }`
- `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }`
- Tailwind: delete the green `primary` palette. Leave `theme.extend` empty, or map `gray` to the monochrome tokens.
**Done when:** fonts render real bold, focusing an input on iOS Safari doesn't zoom, and nothing is green.

### T0.3 Remove dead code
**Files:** `theme.service.ts`, `theme-demo.component.ts`, the commented-out routes and blocks in `main.component.ts` / `food-log.component.html`, unused methods in `FoodLogPage` (`resetAll`, `resetTargetMacros`, `clearLocalStorage`, `getMacroStatus`, `getProgressPercentage`), dialog mode in `CreateMenuComponent`.
**Done when:** `grep -r ThemeService src` is empty and the build passes.

### T0.4 Shared formatting pipes
**Files:** new `src/app/shared/pipes/`
- `kcal` pipe: integer, thousands separator, no unit (`1,240`).
- `macro` pipe: grams, `1.0-0` in lists and `1.0-1` in detail (arg). No unit by default.
- `thaiDate` pipe: moves `formatThaiDate` out of both progress pages. Formats: `short` → `15 ต.ค. 2569`, `day` → `พ. 15 ต.ค.`.
**Done when:** body-composition and circumference pages use the pipe, and there's no duplicated formatter.

### T0.5 Copy and language decision
UI copy is **English** (matching the existing nav and labels), and **dates are Thai Buddhist calendar** (matching the existing charts). Replace the Thai placeholders `ค้นหารายการอาหาร...` and `ค้นหาเมนู...` with `Search menus…`. Use sentence case everywhere. *(Open question Q1: the owner may prefer an all-Thai UI.)*

---

## 6. Phase 1 — Shared components (build before screens)

All go in `src/app/shared/components/`, standalone, `ChangeDetectionStrategy.OnPush`, signal inputs.

### T1.1 App shell rewrite
**Files:** `layout/main/main.component.ts`, `app.routes.ts`
**Do:**
- Routes: `/today`, `/plan`, `/plan/menu/new`, `/plan/menu/:id`, `/foods`, `/progress`. Keep the old paths as `redirectTo` entries so bookmarks and installed shortcuts keep working. Each route has `data: { title, nav, back? }`.
- Header: 44px + `--safe-top` padding, white background, `border-bottom: var(--border)`, no Material primary toolbar color. Title is `subtitle` weight 700. There's a slot for right-side actions. Use a small `HeaderActionsService` (signal of a `TemplateRef`) or `<ng-content select>` via a portal so pages can project ⚙︎ / ⋮ / Save.
- When `back` is set, show a 44px back button on the left.
- Bottom nav: `<nav>` with 4 `<a mat-ripple routerLink routerLinkActive="active">`, each with an icon and a label, `aria-current="page"` when active, height `--nav-h` + `--safe-bottom` padding, `border-top: var(--border)`. Hide it when `data.nav === false`.
  - Icons: `today` → `restaurant`, `plan` → `event_note`, `foods` → `menu_book`, `progress` → `monitoring` (fall back to `show_chart` if missing in the Material Icons font).
- Content: `flex:1; overflow-y:auto; overscroll-behavior:contain; padding: var(--space-sm) var(--space-sm) calc(var(--space-xl) + 56px)` (room for the FAB).
- Remove the `version` display. It moves to the Settings sheet.
**Done when:** the active tab is obvious, nothing is hidden behind the iOS home indicator in standalone mode, and old URLs redirect.

### T1.2 Bottom sheet layout (`app-sheet`)
Replaces `dialog-layout` for every form and picker.
- Use `MatBottomSheet` with a global panel class `nub-sheet`: `max-height: calc(100dvh - var(--safe-top) - 24px)`, radius `--radius-lg` top corners only, padding-bottom `--safe-bottom`.
- A `SheetService.open(component, data, { full?: boolean })` helper that returns `afterDismissed()`.
- Layout: grabber (32×4, gray-200) → header row (title `subtitle`, 44px close **button** with `aria-label="Close"`) → scrollable body → sticky footer with **one** full-width primary button (black, 48px) and an optional text-style secondary.
- Keyboard: when an input is focused the footer must stay visible. Use `position: sticky; bottom: 0` inside the scroll body, not `fixed`.
- Migrate the old `dialog-layout` callers in Phase 2–5, then delete `dialog-layout.component.ts`.
**Done when:** the sheet opens and closes with a swipe-down or the backdrop, the primary button is reachable with a thumb, and nothing jumps when the keyboard opens on iOS and Android.

### T1.3 Swipe row (`app-swipe-row`)
- Built on **CDK Drag** (`cdkDragLockAxis="x"`, `cdkDragBoundary`), per AGENTS.md rule 8. Content projection for the row.
- Swiping left reveals a red (`--c-negative`) background with a white `delete` icon. Past 35% of the row width (or a fling), it emits `(delete)` and the row animates out. Otherwise it springs back.
- Supports `[confirm]="true"` for Firestore-destructive deletes (opens T1.6 instead of deleting right away).
- Optional `navigator.vibrate?.(10)` when crossing the threshold.
- Does **not** block vertical scroll (only start the drag after more than 8px of horizontal movement).
- Also expose a fallback for accessibility: long-press or ⋯ opens a small `mat-menu` with "Delete".
**Done when:** it's used in Today, Plan, Menu editor, and Foods, and the old touch handlers in `menu-plan.component.ts` are gone.

### T1.4 Undoable delete helper
`UndoService.remove({ label, apply, revert })` applies the change right away and shows a snackbar `"{label} removed" [Undo]` for 4s. Undo calls `revert`.
- Global snackbar defaults (`MAT_SNACK_BAR_DEFAULT_OPTIONS`): `duration: 3000`, `panelClass: 'nub-snack'`, positioned **above the bottom nav** (`margin-bottom: calc(var(--nav-h) + var(--safe-bottom))`).
- Snackbar style: black background, white text, action button white and bold.

### T1.5 Macro summary (`app-macro-summary`)
Inputs: `target`, `consumed`, `preview?` (extra amount to show as a hatched/gray-400 segment), `variant: 'hero' | 'compact'`.
- **hero**: `fs-hero` number = kcal left (or "N over" in `--c-negative-text` with the word "over", never color alone), caption "kcal left", 6px kcal bar, then 3 rows `Label · bar · consumed / target g`.
- **compact** (one line, for sheets and the plan footer): `1,520 kcal · 480 left` + `P 120 · C 140 · F 50`.
- Bars: track `--c-gray-100`, fill `--c-black`. Over 100%: fill `--c-negative` with a capped width. `role="progressbar"` with `aria-valuenow`, `aria-valuemax`.
- Macros left: show "`12 g left`" or "`8 g over`". Keep the protein target framed as a minimum: show "`62 / 150 g`" without a negative tone when under.

### T1.6 Confirm dialog (`app-confirm`)
Generalize `pages/food-log/confirm-delete.dialog.ts` → `shared/components/confirm-dialog.component.ts` with `{ title, message, confirmLabel, destructive }`. Destructive confirms are red primary buttons; Cancel is a text button. Replace **every** `confirm()` call.

### T1.7 Small primitives
- `app-empty-state` (`icon`, `title`, `hint`, optional action button). Centered, 40px icon in gray-400, per `.impeccable.md`.
- `app-segmented` (2–3 options, 36px tall, gray-100 track, white active pill with `--shadow-sm`, `role="tablist"`).
- `app-stat-tile` (`label`, `value`, `unit`, `delta?`, `goodDirection?: 'up'|'down'|'none'`). Delta gets a ▲/▼ glyph plus a status text color (never color alone).
- `app-skeleton` (shimmer lines/rows; respects reduced motion).
- `app-qty-input`: − / value / + with a unit suffix. Step depends on the unit (`g`/`ml` → 10, `piece`/`slice`/`serving`/`cup`/`tbsp`/`tsp` → 0.5, others → 1). `inputmode="decimal"`, select-all on focus. Optional quick chips (`[0.5,1,1.5,2] × food.servingSize`).
- `app-food-picker`: search field (sticky, autofocus, clear button), a **Recent** section (last 10 unique foods from the log history, see T2.4) when the query is empty, then the filtered list. Each row: name (`body-md`) + `"165 kcal / 100 g"` (`body-sm` gray-600). Emits `(pick)`. Filtering is diacritic-insensitive and case-insensitive. Lists over 100 items use `cdk-virtual-scroll-viewport` (item size 56).

---

## 7. Phase 2–5 — Screens

### Phase 2 — Today (highest value, ship first)
**T2.1 Today layout.** `pages/food-log/*` (rename folder to `today` is optional; if you do, update imports).
- Header: "Today" + date (`thaiDate:'day'`). Actions: ⚙︎ opens the Settings sheet (T2.5).
- `app-macro-summary variant="hero"` in a flat block (no `mat-card`; `--c-gray-50` background, `--radius-lg`, padding `lg`).
- Section header "Logged · {{count}}" + ⋮ menu → "Clear today's log" (confirm dialog, destructive).
- List: `app-swipe-row` items. Line 1: name (ellipsis) · kcal right (`body-md`, `.num`). Line 2: `150 g · P 46 · C 0 · F 5` (`body-sm`, gray-600). Swipe = remove with Undo (T1.4; **implement Undo for real** by re-inserting at the same index). Tap = Edit sheet (T2.3).
- Empty state: icon `restaurant`, "Nothing logged yet", hint "Tap Add to log your first meal", action button "Add food".
- Extended FAB "＋ Add" (black, 48px, `--shadow-md`), fixed at `bottom: var(--fab-offset); right: var(--space-lg)`. Hide it while the list is scrolling down and show it on scroll up (optional).
- Remove the `mat-card` wrappers, the remain table, and the "Delete All" button.

**T2.2 Add-food sheet.** Rewrite `dialogs/add-food/*` on `app-sheet` + `app-food-picker` + `app-qty-input` + `app-macro-summary variant="compact" [preview]`.
- Step 1 picks a food. Step 2 shows the quantity screen with a back arrow. The quantity defaults to **`food.servingSize`** (not `1`).
- Footer: `Add · {{kcal}} kcal`. After adding, close and show a snackbar "Added Chicken breast" [Undo].
- Step 1 has an `app-segmented` **Foods | Menus** at the top. The Menus tab embeds the pick-menu list in `log` mode (T3.3), which logs the menu as a group (F2).
- **Depends on:** T3.0 and T3.0b (`MenuPlanStore` and `FoodLogStore`). Build those two stores at the start of Phase 2, before T2.1.
- Remove the emoji "After adding" grid and the percentage breakdown bars. The compact summary's one line "`992 kcal left after this`" replaces them.

**T2.3 Edit logged item sheet.** Tapping a row opens `app-qty-input` prefilled with a live preview. Footer: "Save". Secondary text button: "Remove". Recompute `calculatedNutrition` with the same ratio logic as Add (extract it to `shared/utils/nutrition.ts`: `calcNutrition(food, qty)`, and reuse it in Plan and the Menu editor too).

**T2.4 Day-aware log (functional change F1, see §9).**

**T2.5 Settings sheet.** Replaces the target dialog. Sections:
1. **Daily targets.** Fields for kcal, protein, carb, fat (`inputmode="numeric"`, 16px). Live line: "`P 30% · C 50% · F 20%` — macros = 1,960 kcal". If `|4P+4C+9F − kcal| > 50`, show a warning text plus a chip **"Use 1,960 kcal"** that sets kcal. Optional helper text when there's a latest body weight: "Protein guide: 1.6–2.2 g/kg ≈ 148–203 g".
2. **Account.** Signed-in email, then a "Log out" text button in `--c-negative-text` (resolves the `todo: add logout button`).
3. **About.** App version from `package.json`.
Save = primary footer. "Reset to defaults" = a text button inside section 1.

### Phase 3 — Menus & Meal Plan (complete the feature)

> The feature exists, but it is **half-built**. Its whole point is "group foods into a menu, then log the menu in one go", and today there is no path from a menu (or a plan) into the Food Log. This phase finishes the feature end to end, not just the UI.

#### 3.0 Current state (audit of `pages/menu-plan`, `dialogs/create-menu`, `dialogs/select-menu-dialog`, `menu.service.ts`)

**What works**
- Menu CRUD in Firestore (`menu` collection: `{ name, ingredients: [{ foodId, quantity }] }`) through the `/menu-create` and `/menu-edit/:id` pages.
- "Today" tab: add a menu via the select-menu dialog, adjust each ingredient's quantity, see plan totals.

**What's missing or broken**
| ID | Gap | Evidence |
|----|-----|----------|
| M1 | **No way to log a menu or plan into the Food Log.** This is the core purpose, and it's missing. | `MenuPlanComponent` never touches `food-log-logged-foods`. `AddFoodComponent` only lists single foods. |
| M2 | Plan isn't persisted. Navigating away loses it. | `plannedMenus` is component state only |
| M3 | Adding a 2nd menu **resets quantity edits** on menus already in the plan | `onMenuSelectChange()` rebuilds every planned menu from `selectedMenuIds` and the original menu template |
| M4 | The same menu can't be planned twice reliably. Duplicate ids share state, and removal by id removes the wrong one. | `selectedMenuIds.push(menu.id)` with no instance id |
| M5 | `removeMenu()` reads the id *after* `splice`, so it removes the wrong id, or none. Then the ingredient "Undo" (which calls `onMenuSelectChange`) **resurrects removed menus**. | `menu-plan.component.ts` `removeMenu`, `removeFood` |
| M6 | Swipe direction inverted (left does nothing, right deletes) | B3 |
| M7 | Plan totals aren't compared with the daily target or with what's already logged. `targetMacros` is loaded but never used. | `menu-plan.component.ts` `ngOnInit` |
| M8 | Menu list shows "N ingredients" instead of kcal and macros | `menu-plan.component.html` |
| M9 | Deleting a menu is instant, with no confirm or undo | B7 |
| M10 | Menu editor: ingredient quantity can't be edited after adding. Default qty is `0`. The same food can be added twice as separate rows. | `create-menu.component.ts` `addIngredient` |
| M11 | Menu editor: an ingredient whose food was deleted from Foods shows a blank name and silently counts as 0 kcal | `food?.name`, `if (item.food)` in calc |
| M12 | If foods haven't loaded yet when a menu is added to the plan, ingredients get `food: undefined` and stay blank. Realtime food updates never re-map the plan. | `onMenuSelectChange` uses `this.foods` once |
| M13 | Firestore listeners (`getFoodListRealtime`, `getMenuListRealtime`) are never unsubscribed, and pull-to-refresh **adds a new pair of listeners on every pull** | `menu-plan.component.ts` `refreshData`, `create-menu.component.ts` `loadFoods` |
| M14 | Menu editor loads foods twice (realtime listener + `getFoodList()` in `loadMenuForEdit`) | `create-menu.component.ts` |
| M15 | Logged entries have no marker for "this came from a menu" (owner's own TODO: *"add flag that indicate is ingredient / food menu"*) | `food-log.component.html` comment |
| M16 | Menus are unsorted (Firestore doc order) and have no timestamps, so there's no "recently used" ordering | `menu.service.ts` |

#### 3.1 Target model

Three concepts. Keep them separate in code and in copy:

| Concept | What it is | Storage |
|---------|-----------|---------|
| **Menu** (template) | A named, reusable group of foods with default quantities, e.g. "Breakfast set", "Chicken rice bowl" | Firestore `menu` (existing) |
| **Plan** (today) | Menu *instances* the user intends to eat today, each with its own adjusted quantities | `localStorage` `plan:YYYY-MM-DD` |
| **Log** (today) | What was actually eaten. A logged menu becomes a **group** of `LoggedFood` items. | `localStorage` `food-log:YYYY-MM-DD` (F1) |

**Interface changes** (all additive and optional, so old data still loads):

```ts
// menu.interface.ts
export interface Menu {
  id?: string;
  name: string;
  ingredients: MenuIngredient[];
  updatedAt?: number;      // ms epoch, set on add/update → sort "recent"
  lastUsedAt?: number;     // set when planned or logged → "Recent" section in pickers
}

// new: plan.interface.ts
export interface PlannedMenu {
  instanceId: string;      // crypto.randomUUID(); never use menuId as identity (M4)
  menuId: string;
  name: string;            // snapshot, so the plan survives a menu rename or delete
  scale: number;           // 1 = template quantities; ×0.5 / ×1.5 / ×2 quick chips
  ingredients: { foodId: string; quantity: number }[]; // already scaled, user-editable
  loggedAt?: number;       // set when this instance was logged → shows "Logged ✓"
}

// nutrition.interface.ts — LoggedFood (additive)
export interface LoggedFood {
  id?: string;             // crypto.randomUUID(), needed for undo and edit by id
  food: Food;              // existing: a SNAPSHOT of the food at log time (keep this)
  servingSize: number;
  calculatedNutrition: {...};
  group?: { id: string; menuId: string; name: string }; // set when logged from a menu (M15)
  loggedAt?: number;
}
```

Rules:
- When logging, copy the `Food` object into `LoggedFood.food` (as today), so later edits to a food or menu never change history.
- Ingredients whose `foodId` no longer resolves are **skipped when logging**, with a snackbar warning: "1 ingredient skipped (food deleted)".
- Put all nutrition math in `shared/utils/nutrition.ts`: `calcNutrition(food, qty)`, `sumNutrition(items)`, `menuNutrition(menu, foodsById)`. No component keeps its own copy of the formula (there are 4 copies today).

#### 3.2 Shared state service

**T3.0 `MenuPlanStore`** (`src/app/stores/menu-plan.store.ts`, signals, `providedIn: 'root'`)
- Owns **one** realtime subscription each to foods and menus, started on first use and kept for the app lifetime. This fixes M13 and M14 and makes M12 reactive. Exposes `foods`, `foodsById` (computed `Map`), `menus` (sorted by `lastUsedAt ?? updatedAt` desc, then name), `loading`.
- Plan: `plan` signal hydrated from and persisted to `plan:YYYY-MM-DD` (effect). Methods: `addToPlan(menu, scale=1)`, `removeInstance(instanceId)`, `setQty(instanceId, foodId-index, qty)`, `setScale(instanceId, scale)` (re-scales from the template), `clearPlan()`.
- `planTotals` computed, using `foodsById` so totals update when foods load (M12).
- Logging is delegated to `FoodLogStore` (below), so Plan doesn't touch `localStorage` keys directly.

**T3.0b `FoodLogStore`** (`src/app/stores/food-log.store.ts`). Move the log state out of `FoodLogPage` so Today, the Add sheet, and Plan share it.
- `items` signal for today (F1 keys), `targets` signal, `consumed` / `remaining` computed.
- `add(items: LoggedFood[])` returns the ids for undo. `remove(ids)`, `update(id, qty)`, `clear()`.
- `logMenu(menuLike, source)` expands ingredients into `LoggedFood[]` with one shared `group.id`, and stamps `menu.lastUsedAt` (fire-and-forget `updateMenu`).
- `FoodLogPage`, `AddFoodComponent`, `TargetDialog` / Settings, and `MenuPlanComponent` all read from these stores. Remove their direct `localStorage` reads.

#### 3.3 Screens

**T3.1 Plan segment** (`pages/menu-plan/*`)
- `app-segmented` **Plan | Menus**. Remember the last segment in `localStorage`.
- One block per `PlannedMenu` instance:
  - Header: name (`body-md`) + kcal (right) + scale chips `½ 1 1½ 2` (`caption`, selected = black) + ⋯ menu (**Log this menu**, Edit template, Remove from plan).
  - Ingredient rows (`app-swipe-row`, undo via T1.4): name, compact inline qty (16px, 64px wide, unit suffix), kcal right. Missing food → gray-400 italic row "Deleted food", 0 kcal, with a hint icon.
  - Once logged: the header shows a "Logged ✓" caption (`--c-positive-text` + check icon), and the block dims to 60% but stays editable. Logging again asks "Log again?".
- Sticky summary above the nav: `app-macro-summary variant="compact"` showing **plan vs today's remaining** (target − already logged): "`1,520 kcal planned · 480 left after`", turning to "`… · 120 over`" in negative text. Primary button **"Log plan"** logs all un-logged instances (F3) with snackbar "Logged 3 menus · 1,520 kcal [Undo]".
- Empty state: "No plan for today", hint "Plan your meals from saved menus", action "Add a menu".
- FAB "＋" opens T3.3. Remove the pull-to-refresh markup and handlers.

**T3.2 Menus segment**
- Search (sticky). Rows: name + `"640 kcal · P 45 · C 60 · F 20"` (computed with `menuNutrition`), tertiary "4 items". Sorted per T3.0.
- Row tap → `/plan/menu/:id`. Trailing 44px **＋** button = "Add to plan" (snackbar "Added to plan" [View]). Swipe → delete **with confirm** (B7/M9).
- FAB "＋" in this segment = **New menu**.
- Empty state: "No menus yet", hint "Group foods you often eat together", action "New menu".

**T3.3 Pick-menu sheet** (rewrite `select-menu-dialog` on `app-sheet`)
- Used in three places: Plan FAB (mode `plan`), Add-food sheet's **Menus** tab (mode `log`), Menus segment ＋ (no sheet, direct).
- Rows: name + kcal and macros. Recent menus (`lastUsedAt`) come first under a "Recent" caption.
- Mode `log`: tapping opens a **preview step** inside the sheet: ingredient list with editable qty + scale chips + `app-macro-summary compact [preview]` + footer "Log · 640 kcal". Mode `plan`: tap adds right away and closes (multi-select optional).

**T3.4 Menu editor page** (`/plan/menu/new|:id`, `nav:false`, `back:'/plan'`)
- Header action: "Save" text button (disabled until the name is set and there's ≥1 ingredient). Name field: 16px, autofocus on new.
- Ingredient rows: `app-swipe-row` + inline `app-qty-input` (compact, editable at any time, fixes M10) + kcal right. Missing food → "Deleted food" row with a "Remove" text button (M11).
- "＋ Add ingredient" opens a sheet with `app-food-picker` → qty (default `food.servingSize`) → adds. If the food is already in the menu, **merge quantities** instead of adding a duplicate row (snackbar "Updated Rice to 300 g").
- Sticky totals footer: `app-macro-summary variant="compact"` (totals only) + macro split `P 28% · C 50% · F 22%`.
- Edit mode: ⋯ in the header → "Duplicate menu" (copy as "{name} (copy)") and "Delete menu" (confirm).
- Unsaved-changes guard: `canDeactivate` + confirm "Discard changes?".
- Save sets `updatedAt`. Delete the unused dialog mode (T0.3). Remove Tailwind `@apply` and inline `style=`.

**T3.5 Menu groups in Today** (extends T2.1, depends on T3.0b)
- Consecutive `LoggedFood` items that share a `group.id` render as **one collapsible group row**: line 1 menu name + total kcal, line 2 `3 items · P 52 · C 70 · F 18` plus a small `restaurant_menu` icon (the "from menu" flag, M15). Tap expands to show the ingredient rows (indented 12px, each editable and swipeable on its own).
- Swiping the group row removes the whole group (undo restores all of it).
- If every item in a group is removed, the group disappears.

**T3.6 "Save as menu" (optional, after T3.5)**
- Today ⋮ → "Select items" mode (checkboxes) → footer "Save 3 items as menu" opens a name sheet → creates the menu with those foods and quantities. This lets users build menus from what they already logged, the fastest way to grow the menu library.

**Done when (Phase 3):**
- From app open, logging a saved menu takes **≤ 3 taps** (Add → Menus tab → menu → Log).
- The plan survives navigation and an app restart. Adding a second menu doesn't reset edits on the first.
- Planning the same menu twice works, and each instance can be edited and removed on its own.
- Logged menus show as groups in Today, with correct totals, and undo works.
- Deleting a food used in a menu doesn't crash or zero anything silently: the row is marked and skipped when logging, with a warning.
- Only one foods listener and one menus listener exist app-wide (verify with a `console.count` in the callbacks, then remove it).

### Phase 4 — Foods
**T4.1 Food list.** `pages/food-list/*`
- Remove `mat-table`, `desktop-view`, the "Add Food" raised button, the refresh button, and the per-row edit and delete icons.
- Sticky search (`position: sticky; top: 0`, white background) with a result count caption: "128 foods".
- Rows (`app-swipe-row`, `confirm`): name + kcal right, meta `per 100 g · P 31 · C 0 · F 3.6`. Tap = edit sheet. Sorted A→Z, with an optional letter section header if more than 50 items.
- Use `cdk-virtual-scroll-viewport` when there are more than 100 items. Skeleton rows while loading.
- Filter client-side on the already-loaded realtime list. Debounce 150ms. Remove the re-subscribing `searchFoodsRealtime` per keystroke (a UX latency problem).
- FAB "＋" opens the form sheet. Remove the leaky `resize` listener (`isMobile` is unused).

**T4.2 Food form sheet.** Rewrite `dialogs/food-info/*` on `app-sheet`.
- Order: Name → Amount row [`servingSize` (inputmode decimal)] [unit chips: `g ml piece serving` + "More" → `mat-select` of the rest] → Macros row (3 columns: Protein, Carbs, Fat) → Calories.
- Calories auto-suggest: when the user hasn't typed kcal yet, prefill `4P+4C+9F` as the placeholder. If the entered value differs by more than 5%, show a hint "From macros: 412 kcal [Use]".
- `enterkeyhint="next"` and focus moves to the next field. The last field gets `enterkeyhint="done"`, which submits.
- Errors show only after blur or submit, with short copy ("Required", "Must be > 0").
- Edit mode: secondary text button "Delete food" (confirm).

### Phase 5 — Progress
**T5.1 Merge pages.** New `pages/progress/progress.page.ts` with `app-segmented` Body | Measurements. Move the two existing pages' logic into child components (`body-tab`, `measurements-tab`). Delete the old routes but keep the redirects.
- **Remove `seedData()` from `ngOnInit`** (bug B1). Keep the method, but call it nowhere.

**T5.2 Body tab.**
- Hero: latest weight (`fs-hero`) + delta chip vs the previous entry, and a caption "−7.1 kg since {{first date}}" (fix index `[1]` → `[0]`, bug B2).
- Metric chips (Weight, Fat %, Fat mass, Muscle, Visceral) select **one** series for the chart. Range chips: 1M / 3M / 6M / All (default 3M).
- Chart (ngx-echarts) restyle, following the `dataviz` skill: one line `#1a1a1a` 2px, small symbols (4px), area fill `rgba(0,0,0,.04)`, grid lines `--c-gray-100`, axis labels 11px gray-600, no legend, no y-axis name, `min: 'dataMin'` with padding, height 180px, `grid {left:32,right:8,top:8,bottom:24}`, touch tooltip `triggerOn:'mousemove|click'`. Optional dashed 7-entry moving-average line in gray-400 for Weight.
- Stat grid (3 columns, `app-stat-tile`): Fat %, Muscle, Visceral (+ Fat mass if it fits, otherwise 2 rows). `goodDirection`: weight ↓, fat % ↓, fat mass ↓, visceral ↓, muscle ↑.
- History list (newest first): date + `92.4 kg · 31.2 %`. Tap expands to show all fields and the note (read-only; deleting is out of scope).

**T5.3 Measurements tab.** Same structure. Chips: Waist (default), Hip, Chest, Arm, Thigh, Calf. Show L/R averages, and tapping a stat shows L / R. `goodDirection`: waist, hip, thigh ↓; arm, chest = `none` (neutral colors, since it's goal-dependent; Open Q3).

**T5.4 Add-entry sheet** (both tabs) on `app-sheet`.
- Date defaults to today (native `type="date"` input is fine on mobile and less heavy than `mat-datepicker`).
- **Prefill every field with the last entry's values.** The user only edits what changed, and a caption reads "Prefilled from 8 Oct".
- Body: when weight and fat % change, auto-compute `fatMass = weight × % / 100` unless the user edited fat mass by hand.
- Measurements: L/R pairs side by side in a 2-column grid. A "Same for both" toggle copies L → R.
- The note field is collapsed behind "+ Add note".

### Phase 6 — Login & polish
**T6.1 Login.** `pages/login/login.component.ts`
- `type="email" autocomplete="username" inputmode="email"`, password `autocomplete="current-password"` with a show/hide toggle. Submit on Enter.
- Loading state on the button. Inline error text under the form (`--c-negative-text`) from the Firebase error code (`auth/invalid-credential` → "Wrong email or password"). For this, `AuthStore.login` must return a Promise or expose an error signal (small refactor).
- Remove the `mat-card` and center a plain column with app name + icon (from the PWA icon).
**T6.2 Accessibility pass.** Every icon button gets an `aria-label`, focus-visible ring (`outline: 2px solid var(--c-black); outline-offset: 2px`), `role="progressbar"` on bars. Verify contrast with DevTools.
**T6.3 Skeletons.** Replace `mat-spinner` page loaders on Foods, Plan, and Progress with `app-skeleton`.

---

## 8. Bugs found during the audit (fix in the task listed)
| ID | Bug | Fix in |
|----|-----|--------|
| B1 | `BodyCompositionPage.ngOnInit` / circumference page call `seedData()` on every visit, which writes demo data into Firestore when empty | T5.1 |
| B2 | `getProgressDiff()` and `getDateRange()` use `data[1]` as the first record | T5.2 |
| B3 | Plan swipe direction is inverted: `diff = start − current` then `min(0, diff)`, so left-swipes do nothing and right-swipes delete | T1.3 / T3.1 |
| B4 | `removeMenu()` updates `selectedMenuIds` using the index *after* `splice`, removing the wrong id or none | T3.1 |
| B5 | Plan state is lost on navigation | T3.1 |
| B6 | Food Log snackbar "Undo" has no handler | T2.1 |
| B7 | `deleteMenu()` deletes from Firestore with no confirm and no undo | T3.2 |
| B8 | `FoodListComponent` adds an anonymous `resize` listener it can never remove | T4.1 |
| B9 | `dialog-layout` title color uses an undefined `--primary` | T1.2 (component deleted) |
| B10 | Food List re-subscribes to Firestore on every debounced keystroke | T4.1 |
| B11 | Menus and Plan: see M1–M16 in §3.0 (plan resets on add, duplicate-instance identity, leaking listeners, missing-food handling) | Phase 3 |

---

## 9. Small functional changes required by the UX
| ID | Change | Notes |
|----|--------|-------|
| F1 | **Day-aware food log.** Store logs as `food-log:YYYY-MM-DD` (local date). Today reads the current day. On first load, migrate the legacy `food-log-logged-foods` into today's key, then delete the legacy key. Keep `food-log-target-macros` unchanged. Prune keys older than 30 days. The Recent list (T1.7) is derived from these keys. | No date navigation in this plan (Open Q2) |
| F2 | Log a menu → expands ingredients into `LoggedFood[]` with a shared `group` | `FoodLogStore.logMenu`, see §3.1 and T3.0b |
| F3 | Plan "Log plan" / "Log this menu" → same as F2, per `PlannedMenu` instance, sets `loggedAt` | T3.1 |
| F3b | Plan persisted per day (`plan:YYYY-MM-DD`), pruned with the same 30-day rule as F1 | T3.0 |
| F3c | `Menu.updatedAt` / `lastUsedAt` (optional fields) for recent sorting | T3.0, T3.4 |
| F4 | Firestore offline cache: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })` in `firebase.service.ts` | Foods and menus work offline in the installed PWA |
| F5 | `AuthStore.login` returns a Promise or error signal; add `logout()` (sign out → clear `isLoggedIn` → `/login`) | T6.1 / T2.5 |

---

## 10. Phase 7 — PWA
**T7.1 Add the service worker and manifest.** Run `ng add @angular/pwa@18 --project personal-app`. Then fix the following, because the generator assumes default paths:
- Make sure `src/manifest.webmanifest` and `src/assets/icons/*` are in `angular.json → build.options.assets` (`src/assets` is referenced but doesn't exist yet, so create it). **Do not** place source files in `/public` (that's the build output and Hosting root).
- Manifest: `name: "Nub Cal"`, `short_name: "Nub Cal"`, `display: "standalone"`, `orientation: "portrait"`, `background_color: "#ffffff"`, `theme_color: "#ffffff"`, `start_url: "/today"`, `scope: "/"`, icons 192/512 + **maskable** 512 (monochrome: black rounded square, white "N" or fork glyph; generate the PNGs with a script and commit them), `shortcuts`: [{"name":"Add food","url":"/today?add=1"}] (Today opens the Add sheet when `add=1`).
- `index.html`: `<meta name="theme-color" content="#ffffff">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=default`, `apple-mobile-web-app-title=Nub Cal`, `<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon-180.png">`.
- `ngsw-config.json`: app shell prefetch; `assetGroups` lazy for `assets/**`; a `dataGroups` or asset entry caching `https://fonts.googleapis.com/**` and `https://fonts.gstatic.com/**` (performance strategy, 30d).
- `firebase.json` hosting headers: `Cache-Control: no-cache` for `/index.html`, `/ngsw.json`, `/ngsw-worker.js`, `/manifest.webmanifest`. `max-age=31536000, immutable` for hashed `*.js|*.css`.
**T7.2 Update prompt.** `SwUpdate.versionUpdates` → on `VERSION_READY`, show a snackbar "New version available" [Reload].
**T7.3 Install hint (optional).** On Android, capture `beforeinstallprompt` and show an "Install app" row in the Settings sheet. On iOS (not standalone), show a one-time hint row: "Share → Add to Home Screen".
**Done when:** a Lighthouse PWA check reports *installable*; in standalone mode on iOS and Android, the header and nav respect safe areas; airplane mode still opens the app shell and Today (localStorage), and Foods shows cached data (F4).

---

## 11. Verification checklist (per phase)
- [ ] `npm run build` passes and budgets hold.
- [ ] 375×667 and 390×844: no horizontal scroll, no content hidden under the nav, FAB, or sticky footers.
- [ ] Every tappable element is ≥ 44px. Every input font is ≥ 16px.
- [ ] Only colors from tokens. Status color is always paired with text or a glyph.
- [ ] Numbers use the T0.4 pipes and `tabular-nums`.
- [ ] Destructive actions use undo (local data) or confirm (Firestore data). No native `confirm()`.
- [ ] Keyboard open (iOS Safari + Android Chrome): the sheet footer stays visible and the focused input isn't covered.
- [ ] Core flow timing: from app open, log a known recent food in **≤ 3 taps** (Add → Recent item → Add).

---

## 12. Out of scope (do not build)
- Meal slots (breakfast/lunch/dinner), barcode scanning, exercise logging, date navigation and history for the food log, dark mode, multi-user `userId` (Progress still uses `default_user`), editing or deleting body entries.

## 13. Open questions for the owner
- **Q1** All-Thai UI copy, or English UI with Thai dates (the current plan)?
- **Q2** Should Today get ← → day navigation to view past days (data from F1 makes this cheap)?
- **Q3** Goal direction for circumference (cutting vs bulking) changes which deltas are "good". Should it be a setting?
- **Q4** Keep `mat-datepicker` for desktop use, or is native date input fine?

---

## 14. Implementation notes & deviations (as built)

| Plan item | As built | Why |
|-----------|----------|-----|
| T1.3 swipe row on **CDK Drag** | Custom Pointer-Events `app-swipe-row` | CDK sets `touch-action: none` on the drag element, which blocks vertical scrolling of lists on phones. AGENTS.md rule 8 updated. |
| T5.2 metric **chips** + stat tiles | Stat tiles double as the metric selector (tap a tile → hero + chart change); chips only for the range | Fewer controls, same information. |
| T1.7 virtual scroll in food picker | Result list capped at 80 with a "keep typing" hint | Virtual scroll inside a sheet body is fragile; revisit if the food list grows large. |
| T7.3 install hint | **Not built** | Optional. |
| T3.6 "Save as menu" | **Not built** | Optional. |
| Dev-only | `@angular/service-worker@18.2.13` added (must match `@angular/core`) | `ng add` was avoided to control config manually. |

**Still to verify on device:** swipe vs. scroll feel, bottom-sheet footer with the iOS keyboard, `100dvh` + safe-area in standalone mode, install prompt / icons, service-worker update flow (production build only).
**Pre-existing, untouched:** initial bundle exceeds the 500 kB budget warning (Firebase + Material); `seedData()` still exists in `body-composition.service.ts` but is no longer called.

---

## 15. Round 2 (2026-10-15): accounts, onboarding, green theme

- **Accounts:** sign up / log in / forgot password / "Try without an account" (Firebase anonymous auth, upgradeable to email in Settings). `SessionService` replaces the old `AuthStore`/`StoreService`/`ApiService` layer.
- **Per-user data:** everything moved to `users/{uid}/{foods,menus,body_composition,circumference,logs}` via `UserDataService`. Profile doc `users/{uid}` holds `targets`, `onboarded`, `body`. The food log now syncs to `users/{uid}/logs/{YYYY-MM-DD}` (localStorage is only a cache). Firestore offline cache (F4) enabled.
- **Onboarding (`/welcome`):** goal + body details → Mifflin-St Jeor targets → guide → start with starter foods/menus and/or import previous data. Settings → "Recalculate from my details" reuses it (`/welcome?mode=targets`). Settings → "How to use Nub Cal" opens the guide.
- **Legacy data:** the shared pre-account collections are imported per account (Settings → Import, or the last onboarding step). Old device logs/targets are claimed by the first account that signs in on that device.
- **Security:** `firestore.rules` now only allows `users/{own uid}/**`. Deploy order: import first, then deploy rules.
- **Theme:** primary is pastel green; fat moved to sky blue so it no longer collides with the brand colour.
- **Chart bug:** range chips counted back from *today*, so an account whose last entry was months ago showed an empty chart. Ranges now count back from the latest entry, and an empty range shows a hint instead of a blank chart.

# AI Agent Instructions

Welcome to the **Nub Cal** project repository!

## Design & UI Guidelines

Before making any changes to the UI, adding new components, or writing CSS/SCSS/HTML, you **MUST** read and understand the design guidelines located in the root directory:

**`.impeccable.md`**

This file contains the core design context, tokens (spacing scale, font scale, color palette), and component patterns that ensure a consistent, minimal, and effortless experience for our users. 

### Key Rules for Agents:
1. **Always refer to `.impeccable.md`** before styling.
2. **Do not** introduce new colors outside the pastel tokens in `.impeccable.md`, arbitrary spacing values, or heavy UI components (like nested cards, gradients or shadows).
3. **Use the defined tokens** (spacing variables, pastel `-bg`/`-fill`/`-text` triples). Text on a pastel surface uses that surface's `-text` token.
4. **Maintain a mobile-first, high-density focus**.

### Specific Patterns & Guidelines:
5. **Avoid `h` tags**: Use `div` instead of `h1`, `h2`, `h3` for headings to avoid default margins and maintain strict control over layout rhythm.
6. **Compact Form Fields**: For list items and high-density areas, reduce `mat-form-field` height to ~40px using custom CSS (e.g., `.compact-field`).
7. **Prevent Text Overlap**: In compact form fields, remove `mat-label` or avoid floating labels if they overlap with the input text. Rely on placeholders or units (e.g., "g") for context.
8. **Swipe-to-Delete**: Use the shared `<app-swipe-row>` component (Pointer Events, `touch-action: pan-y`) for deleting list items instead of bulky delete buttons. Do not use CDK Drag for rows: it sets `touch-action: none` and blocks vertical scrolling. Local data: delete + Undo snackbar (`UndoService`). Firestore data: `[confirm]="true"` + `ConfirmService`.
10. **Bottom sheets, not dialogs**: Forms and pickers use `SheetService` + `<app-sheet>`. Native `confirm()`/`alert()` are not allowed.
11. **Shared state & data**: All user data lives under `users/{uid}/…` (see `firestore.rules`); go through `UserDataService`, never `collection(db, 'foods')` directly. Auth is `SessionService`; profile/targets/onboarding is `ProfileStore`. Use `FoodLogStore` (daily log, synced to `users/{uid}/logs/{date}`) and `MenuPlanStore` (foods, menus, plan). Do not subscribe to Firestore foods/menus in pages. Nutrition math lives in `shared/utils/nutrition.ts`.
9. **Centered Empty States**: Ensure empty states (no logs/no items) are centered with an icon and clear message.

By following these guidelines, you will help maintain the "Minimal, Precise, Effortless" aesthetic of Nub Cal.

# AI Agent Instructions

Welcome to the **Nub Cal** project repository!

## Design & UI Guidelines

Before making any changes to the UI, adding new components, or writing CSS/SCSS/HTML, you **MUST** read and understand the design guidelines located in the root directory:

**`.impeccable.md`**

This file contains the core design context, tokens (spacing scale, font scale, color palette), and component patterns that ensure a consistent, minimal, and effortless experience for our users. 

### Key Rules for Agents:
1. **Always refer to `.impeccable.md`** before styling.
2. **Do not** introduce new colors, arbitrary spacing values, or heavy UI components (like nested cards or deep shadows).
3. **Use the defined tokens** (e.g., spacing variables, monochrome base colors with muted status indicators).
4. **Maintain a mobile-first, high-density focus**.

### Specific Patterns & Guidelines:
5. **Avoid `h` tags**: Use `div` instead of `h1`, `h2`, `h3` for headings to avoid default margins and maintain strict control over layout rhythm.
6. **Compact Form Fields**: For list items and high-density areas, reduce `mat-form-field` height to ~40px using custom CSS (e.g., `.compact-field`).
7. **Prevent Text Overlap**: In compact form fields, remove `mat-label` or avoid floating labels if they overlap with the input text. Rely on placeholders or units (e.g., "g") for context.
8. **Swipe-to-Delete**: Use swipe gestures (Angular CDK Drag) for deleting list items instead of adding bulky delete buttons.
9. **Centered Empty States**: Ensure empty states (no logs/no items) are centered with an icon and clear message.

By following these guidelines, you will help maintain the "Minimal, Precise, Effortless" aesthetic of Nub Cal.

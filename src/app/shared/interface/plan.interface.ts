export interface PlannedMenu {
  /** Identity of this instance in the plan (the same menu can be planned twice). */
  instanceId: string;
  menuId: string;
  /** Snapshot so the plan survives a menu rename/delete. */
  name: string;
  /** 1 = template quantities. */
  scale: number;
  /** Already scaled, user-editable. */
  ingredients: { foodId: string; quantity: number }[];
  loggedAt?: number;
}

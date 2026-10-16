export interface MenuIngredient {
  foodId: string;
  quantity: number;
}

export interface Menu {
  id?: string;
  name: string;
  ingredients: MenuIngredient[];
  /** ms epoch; set on add/update. */
  updatedAt?: number;
  /** ms epoch; set when planned or logged. */
  lastUsedAt?: number;
}

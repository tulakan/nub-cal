export interface MenuIngredient {
  foodId: string;
  quantity: number;
}

export interface Menu {
  id?: string;
  name: string;
  ingredients: MenuIngredient[];
}

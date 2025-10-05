import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../shared/modules/material.module';
import { StoreService } from '../../stores/store.service';

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <button mat-raised-button color="primary">Food Log Page</button>
  `,
  styles: ``,
})
export class FoodLogPage implements OnInit {
  store = inject(StoreService);
  constructor() {
    // effect(() => {
    //   const foods = this.store.food.foodOptions();
    //   console.log('foods >> ', foods);
    // });
  }

  async ngOnInit() {
    const foods = await this.store.food.getFoods();
    console.log('foods >> ', foods);
    // console.log('foods >> ', foods);
  }
}

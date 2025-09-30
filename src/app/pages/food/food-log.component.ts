import { Component } from '@angular/core';
import { MaterialModule } from '../../shared/modules/material.module';

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <button mat-raised-button color="primary">Food Log Page</button>
  `,
  styles: ``,
})
export class FoodLogPage {
  constructor() {
    console.log('FoodLogPage loaded');
  }
}

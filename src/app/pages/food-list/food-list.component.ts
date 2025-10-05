import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FoodInfoComponent } from '../../dialogs/food-info/food-info.component';
import { Food } from '../../shared/interface/food.interface';
import { FoodService } from '../../shared/services/food.service';

@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './food-list.component.html',
  styleUrls: ['./food-list.component.scss'],
})
export class FoodListComponent implements OnInit, OnDestroy {
  private foodService = inject(FoodService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'name',
    'kcal',
    'servingSizeUnit',
    'protein',
    'carb',
    'fat',
    'actions',
  ];
  dataSource: Food[] = [];
  filteredData: Food[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  isMobile: boolean = false;
  private unsubscribe?: () => void;
  private searchTimeout?: number;

  ngOnInit() {
    this.loadFoods();
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  loadFoods() {
    this.isLoading = true;

    // Use real-time search listener for live updates with search capability
    this.setupRealtimeSearch();
  }

  private setupRealtimeSearch() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.foodService.searchFoodsRealtime(
      this.searchTerm,
      (foods: Food[]) => {
        this.dataSource = foods;
        this.filteredData = foods;
        this.isLoading = false;
      }
    );
  }
  onSearchChange() {
    // Debounce search to avoid too many calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.performSearch();
    }, 300); // 300ms debounce
  }

  private performSearch() {
    this.isLoading = true;
    this.setupRealtimeSearch();
  }

  addFood() {
    const dialogRef = this.dialog.open(FoodInfoComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: { isEdit: false },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.handleAddFood(result);
      }
    });
  }

  editFood(food: Food) {
    const dialogRef = this.dialog.open(FoodInfoComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: { food, isEdit: true },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.handleUpdateFood(result);
      }
    });
  }

  deleteFood(food: Food) {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${food.name}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      this.handleDeleteFood(food);
    }
  }

  private async handleAddFood(foodData: Food) {
    try {
      await this.foodService.addFood(foodData);
      this.snackBar.open(`Successfully added "${foodData.name}"`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error) {
      console.error('Error adding food:', error);
      this.snackBar.open(
        `Failed to add "${foodData.name}". Please try again.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  private async handleUpdateFood(foodData: Food) {
    try {
      await this.foodService.updateFood(foodData.id, foodData);
      this.snackBar.open(`Successfully updated "${foodData.name}"`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error) {
      console.error('Error updating food:', error);
      this.snackBar.open(
        `Failed to update "${foodData.name}". Please try again.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  private async handleDeleteFood(food: Food) {
    try {
      await this.foodService.deleteFood(food.id);
      this.snackBar.open(`Successfully deleted "${food.name}"`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error) {
      console.error('Error deleting food:', error);
      this.snackBar.open(
        `Failed to delete "${food.name}". Please try again.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  getServingSizeWithUnit(food: Food): string {
    return `${food.servingSize} ${food.unit}`;
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  clearSearch() {
    this.searchTerm = '';
    this.performSearch();
  }
}

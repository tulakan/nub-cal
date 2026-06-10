import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { Food } from '../interface/food.interface';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class FoodService {
  firebaseService = inject(FirebaseService);
  constructor() {}

  // Method 1: Get all documents from collection
  async getFoodList() {
    const querySnapshot = await getDocs(
      collection(this.firebaseService.db, 'foods')
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  // Method 2: Get a single document by ID
  async getFoodById(id: string) {
    const docRef = doc(this.firebaseService.db, 'foods', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.log('No such document!');
      return null;
    }
  }

  // Method 3: Query with conditions (where, orderBy, limit)
  async getFoodsByCalories(maxCalories: number) {
    const q = query(
      collection(this.firebaseService.db, 'foods'),
      where('calories', '<=', maxCalories),
      orderBy('calories', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  // Method 4: Real-time listener (returns data immediately when it changes)
  getFoodListRealtime(callback: (foods: any[]) => void) {
    const unsubscribe = onSnapshot(
      collection(this.firebaseService.db, 'foods'),
      querySnapshot => {
        const foods = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        callback(foods);
      },
      error => {
        console.error('Error getting real-time updates:', error);
      }
    );

    // Return unsubscribe function to stop listening
    return unsubscribe;
  }

  // Method 5: Using forEach (alternative to map)
  async getFoodListWithForEach() {
    const querySnapshot = await getDocs(
      collection(this.firebaseService.db, 'foods')
    );

    const foods: any[] = [];
    querySnapshot.forEach(doc => {
      foods.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return foods;
  }

  addFood(foodData: Food) {
    const docRef = doc(collection(this.firebaseService.db, 'foods'));
    return setDoc(docRef, foodData);
  }

  // Update existing food
  updateFood(id: string, foodData: Partial<Food>) {
    const docRef = doc(this.firebaseService.db, 'foods', id);
    return setDoc(docRef, foodData, { merge: true });
  }

  // Delete food by ID
  async deleteFood(id: string) {
    const docRef = doc(this.firebaseService.db, 'foods', id);
    return deleteDoc(docRef);
  }

  // Search foods by name (Firestore text search)
  async searchFoodsByName(searchTerm: string) {
    if (!searchTerm.trim()) {
      return this.getFoodList();
    }

    const searchTermLower = searchTerm.toLowerCase();

    // Firestore doesn't have full-text search, so we'll use array-contains for partial matching
    // This is a basic implementation - for advanced search, consider using Algolia or similar
    const q = query(
      collection(this.firebaseService.db, 'foods'),
      orderBy('name')
    );

    const querySnapshot = await getDocs(q);
    const foods = querySnapshot.docs.map(doc => ({
      ...(doc.data() as Food),
      id: doc.id,
    }));

    // Client-side filtering for more flexible search
    return foods.filter(food =>
      food.name.toLowerCase().includes(searchTermLower)
    );
  }

  // Advanced search with multiple criteria
  async searchFoods(searchCriteria: {
    name?: string;
    maxCalories?: number;
    minCalories?: number;
    maxProtein?: number;
    minProtein?: number;
    maxCarbs?: number;
    minCarbs?: number;
    maxFat?: number;
    minFat?: number;
    unit?: string;
  }) {
    let q = query(collection(this.firebaseService.db, 'foods'));

    // Add Firestore queries where possible
    if (searchCriteria.maxCalories) {
      q = query(q, where('kcal', '<=', searchCriteria.maxCalories));
    }
    if (searchCriteria.minCalories) {
      q = query(q, where('kcal', '>=', searchCriteria.minCalories));
    }
    if (searchCriteria.unit) {
      q = query(q, where('unit', '==', searchCriteria.unit));
    }

    const querySnapshot = await getDocs(q);
    let foods = querySnapshot.docs.map(doc => ({
      ...(doc.data() as Food),
      id: doc.id,
    }));

    // Client-side filtering for criteria that Firestore can't handle efficiently
    if (searchCriteria.name) {
      const nameFilter = searchCriteria.name.toLowerCase();
      foods = foods.filter(food =>
        food.name.toLowerCase().includes(nameFilter)
      );
    }

    if (searchCriteria.maxProtein !== undefined) {
      foods = foods.filter(food => food.protein <= searchCriteria.maxProtein!);
    }
    if (searchCriteria.minProtein !== undefined) {
      foods = foods.filter(food => food.protein >= searchCriteria.minProtein!);
    }

    if (searchCriteria.maxCarbs !== undefined) {
      foods = foods.filter(food => food.carb <= searchCriteria.maxCarbs!);
    }
    if (searchCriteria.minCarbs !== undefined) {
      foods = foods.filter(food => food.carb >= searchCriteria.minCarbs!);
    }

    if (searchCriteria.maxFat !== undefined) {
      foods = foods.filter(food => food.fat <= searchCriteria.maxFat!);
    }
    if (searchCriteria.minFat !== undefined) {
      foods = foods.filter(food => food.fat >= searchCriteria.minFat!);
    }

    return foods;
  }

  // Real-time search with callback
  searchFoodsRealtime(searchTerm: string, callback: (foods: Food[]) => void) {
    const unsubscribe = onSnapshot(
      collection(this.firebaseService.db, 'foods'),
      querySnapshot => {
        let foods = querySnapshot.docs.map(doc => ({
          ...(doc.data() as Food),
          id: doc.id,
        }));

        // Apply search filter
        if (searchTerm.trim()) {
          const searchTermLower = searchTerm.toLowerCase();
          foods = foods.filter(
            food =>
              food.name.toLowerCase().includes(searchTermLower) ||
              food.unit.toLowerCase().includes(searchTermLower) ||
              food.kcal.toString().includes(searchTerm) ||
              food.protein.toString().includes(searchTerm) ||
              food.carb.toString().includes(searchTerm) ||
              food.fat.toString().includes(searchTerm)
          );
        }

        callback(foods);
      },
      error => {
        console.error('Error in real-time search:', error);
      }
    );

    return unsubscribe;
  }

  // Get foods by category/type (if you want to add categories later)
  async getFoodsByCategory(category: string) {
    const q = query(
      collection(this.firebaseService.db, 'foods'),
      where('category', '==', category),
      orderBy('name')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as Food),
      id: doc.id,
    }));
  }

  // Get foods with high protein (utility method)
  async getHighProteinFoods(minProtein: number = 20) {
    const foods = await this.getFoodList();
    return foods
      .filter(food => (food as Food).protein >= minProtein)
      .sort((a, b) => (b as Food).protein - (a as Food).protein);
  }

  // Get low calorie foods (utility method)
  async getLowCalorieFoods(maxCalories: number = 100) {
    const foods = await this.getFoodList();
    return foods
      .filter(food => (food as Food).kcal <= maxCalories)
      .sort((a, b) => (a as Food).kcal - (b as Food).kcal);
  }
}

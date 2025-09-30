import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from "firebase/app";
import { FirebaseConfig } from '../environments/firebase.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet> `,
  styles: ``,
})
export class AppComponent {
  title = 'personal-app';
  app = initializeApp(FirebaseConfig);


  constructor() {
    // console.log('Firebase initialized', this.app);
  }
}

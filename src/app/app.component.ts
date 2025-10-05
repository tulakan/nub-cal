import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet> `,
  styles: ``,
})
export class AppComponent {
  title = 'personal-app';

  constructor() {
    // Firebase is now initialized in FirebaseService
  }
}

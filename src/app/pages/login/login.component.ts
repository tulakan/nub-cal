import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/modules/material.module';
import { ApiService } from '../../shared/services/api.service';
import { StoreService } from '../../stores/store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  template: `
    <div class="full-page-container">
      <mat-card class="login-card">
        <div class="app-title">NUB R HAN</div>
        <form
          class="login-form"
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
        >
          <mat-form-field appearance="fill" class="form-field email">
            <mat-label>Email</mat-label>
            <input
              matInput
              placeholder="Enter your email"
              formControlName="email"
            />
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field password">
            <mat-label>Password</mat-label>
            <input
              matInput
              type="password"
              placeholder="Enter your password"
              formControlName="password"
            />
          </mat-form-field>
          <button mat-raised-button color="primary" class="full-width">
            Login
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: `
    .full-page-container {
      width: 100%;
      height: 100%;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-gradient);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .login-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .form-field {
      width: 100%;
    }
    .app-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 8px;
    }
  `,
})
export class LoginPage {
  store = inject(StoreService);
  service = inject(ApiService);
  formBuilder = inject(FormBuilder);

  constructor() {}

  loginForm = this.formBuilder.group({
    email: [''],
    password: [''],
  });

  onSubmit() {
    const formValue = this.loginForm.value;
    console.log('Form submitted:', formValue);

    const email = formValue.email;
    const password = formValue.password;
    if (email && password) {
      this.store.auth.login(email, password);
    }
  }
}

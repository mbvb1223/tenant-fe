import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  isLoginMode = true;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = '';
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    const authObservable = this.isLoginMode
      ? this.authService.login(this.email, this.password)
      : this.authService.register(this.email, this.password);

    authObservable.subscribe({
      next: (result) => {
        console.log(result);
        this.loading = false;
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'An error occurred';
      }
    });
  }

  onGoogleLogin() {
    this.loading = true;
    this.error = '';

    this.authService.loginWithGoogle().subscribe({
      next: (result) => {
        this.loading = false;
        console.log('Google Login Success:', result);
        console.log('User Info:', result.user);
        console.log('Credential:', result.credential);
        this.router.navigate(['/index']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Google Login Error:', error);
        this.error = error.message || 'Google login failed';
      }
    });
  }
}

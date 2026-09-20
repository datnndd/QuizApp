import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly identifier = signal<string>('alex.rider@heroacademy.edu');
  protected readonly password = signal<string>('supersecretcipher123');
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    const id = this.identifier().trim();
    const pwd = this.password();

    if (!id || !pwd) {
      this.errorMessage.set('Please enter both your identifier and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ identifier: id, password: pwd }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Invalid username/email or password. Please try again.'
        );
      }
    });
  }
}

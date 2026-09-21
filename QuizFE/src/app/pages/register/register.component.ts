import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly firstName = signal<string>('Alex');
  protected readonly lastName = signal<string>('Rider');
  protected readonly username = signal<string>('quiz_champion_99');
  protected readonly phone = signal<string>('+1 (555) 019-2834');
  protected readonly email = signal<string>('alex.rider@heroacademy.edu');
  protected readonly password = signal<string>('SuperSecret2025!');
  protected readonly confirmPassword = signal<string>('SuperSecret2025!');
  protected readonly agreeTerms = signal<boolean>(true);

  protected readonly showPassword = signal<boolean>(false);
  protected readonly showConfirmPassword = signal<boolean>(false);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  onSubmit(): void {
    const fn = this.firstName().trim();
    const ln = this.lastName().trim();
    const un = this.username().trim();
    const em = this.email().trim();
    const pwd = this.password();
    const cpwd = this.confirmPassword();

    if (!fn || !ln || !un || !em || !pwd) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    if (pwd !== cpwd) {
      this.errorMessage.set('Passwords do not match. Please verify.');
      return;
    }

    if (pwd.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    if (!this.agreeTerms()) {
      this.errorMessage.set('You must accept the Hero Academy Codex & Terms to enlist.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({
        firstName: fn,
        lastName: ln,
        userName: un,
        email: em,
        password: pwd,
        phoneNumber: this.phone()?.trim() || null
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Registration failed. Username or email may already be registered.'
          );
        }
      });
  }
}

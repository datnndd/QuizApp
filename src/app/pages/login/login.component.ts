import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly router = inject(Router);

  protected readonly identifier = signal<string>('alex.rider@heroacademy.edu');
  protected readonly password = signal<string>('supersecretcipher123');
  protected readonly showPassword = signal<boolean>(false);

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    console.log('Login submitted:', {
      identifier: this.identifier(),
      password: this.password()
    });
    this.router.navigate(['/dashboard']);
  }
}

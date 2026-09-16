import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
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
  }
}

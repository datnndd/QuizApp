import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
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

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  onSubmit(): void {
    console.log('Registration submitted:', {
      firstName: this.firstName(),
      lastName: this.lastName(),
      username: this.username(),
      phone: this.phone(),
      email: this.email(),
      agreeTerms: this.agreeTerms()
    });
  }
}

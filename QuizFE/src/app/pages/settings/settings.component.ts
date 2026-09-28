import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UpdateProfileRequest, UserInfo } from '../../core/models/auth.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Form Fields
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  readonly displayName = signal<string>('');
  readonly email = signal<string>('');
  readonly phoneNumber = signal<string>('');
  readonly userName = signal<string>('');
  readonly roles = signal<string[]>([]);

  // Security Fields
  readonly currentPassword = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly showPasswordSection = signal<boolean>(false);

  readonly userInitials = computed(() => {
    const name = this.displayName() || `${this.firstName()} ${this.lastName()}`.trim() || this.userName();
    if (!name) return 'U';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const cached = this.currentUser();
    if (cached) {
      this.populateFields(cached);
    }

    this.isLoading.set(true);
    this.authService.getMe().subscribe({
      next: (user) => {
        this.populateFields(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private populateFields(user: UserInfo): void {
    this.firstName.set(user.firstName || '');
    this.lastName.set(user.lastName || '');
    this.displayName.set(user.displayName || '');
    this.email.set(user.email || '');
    this.phoneNumber.set(user.phoneNumber || '');
    this.userName.set(user.userName || '');
    this.roles.set(user.roles || []);
  }

  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) {
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
  }

  saveProfile(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const fName = this.firstName().trim();
    const lName = this.lastName().trim();
    const mail = this.email().trim();

    if (!fName) {
      this.errorMessage.set('First name is required.');
      return;
    }
    if (!lName) {
      this.errorMessage.set('Last name is required.');
      return;
    }
    if (!mail || !mail.includes('@')) {
      this.errorMessage.set('A valid email address is required.');
      return;
    }

    // Password validation if changing password
    const newPwd = this.newPassword().trim();
    const currPwd = this.currentPassword().trim();
    const confPwd = this.confirmPassword().trim();

    if (newPwd.length > 0 || currPwd.length > 0 || confPwd.length > 0) {
      if (!currPwd) {
        this.errorMessage.set('Current password is required to update your password.');
        return;
      }
      if (newPwd.length < 6) {
        this.errorMessage.set('New password must be at least 6 characters long.');
        return;
      }
      if (newPwd !== confPwd) {
        this.errorMessage.set('New password and confirmation do not match.');
        return;
      }
    }

    const payload: UpdateProfileRequest = {
      firstName: fName,
      lastName: lName,
      displayName: this.displayName().trim() || `${fName} ${lName}`,
      email: mail,
      phoneNumber: this.phoneNumber().trim() || null,
      currentPassword: currPwd || null,
      newPassword: newPwd || null
    };

    this.isSaving.set(true);
    this.authService.updateProfile(payload).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.populateFields(updatedUser);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.showPasswordSection.set(false);
        this.successMessage.set('Profile information updated successfully!');

        setTimeout(() => {
          this.successMessage.set(null);
        }, 5000);
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to update profile settings. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  resetForm(): void {
    const cached = this.currentUser();
    if (cached) {
      this.populateFields(cached);
    }
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly mobileMenuOpen = signal<boolean>(false);
  readonly userMenuOpen = signal<boolean>(false);

  readonly userName = computed(() => this.currentUser()?.displayName || 'Student');
  readonly userEmail = computed(() => this.currentUser()?.email || '');
  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.slice(0, 2).toUpperCase();
    }
    return 'QZ';
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

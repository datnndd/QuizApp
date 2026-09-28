import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly mobileMenuOpen = signal<boolean>(false);
  readonly userMenuOpen = signal<boolean>(false);
  readonly codeModalOpen = signal<boolean>(false);
  readonly inputCode = signal<string>('');
  readonly codeError = signal<string>('');
  readonly isSubmittingCode = signal<boolean>(false);

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

  openCodeModal(): void {
    this.inputCode.set('');
    this.codeError.set('');
    this.codeModalOpen.set(true);
    this.mobileMenuOpen.set(false);
  }

  closeCodeModal(): void {
    this.codeModalOpen.set(false);
  }

  joinByCode(): void {
    const code = this.inputCode().trim().toUpperCase();
    if (!code || code.length < 4) {
      this.codeError.set('Please enter a valid quiz code.');
      return;
    }

    this.isSubmittingCode.set(true);
    this.codeError.set('');

    this.quizService.getQuizByCode(code).subscribe({
      next: (quiz) => {
        this.isSubmittingCode.set(false);
        this.closeCodeModal();
        if (quiz?.id) {
          this.router.navigate(['/quiz/play', quiz.id]);
        } else {
          this.router.navigate(['/explore']);
        }
      },
      error: () => {
        this.isSubmittingCode.set(false);
        this.codeError.set('Quiz code not found. Please verify the code.');
      }
    });
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

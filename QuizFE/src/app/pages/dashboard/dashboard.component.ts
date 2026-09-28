import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import {
  AttemptSummary,
  calculateAccuracy,
  isAttemptCompleted,
  isAttemptInProgress,
  QuizSummary
} from '../../core/models/quiz.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isAdmin = this.authService.isAdmin;
  readonly showUnauthorizedAlert = signal<boolean>(
    this.route.snapshot.queryParamMap.get('unauthorized') === 'true'
  );

  protected readonly currentUser = this.authService.currentUser;
  protected readonly userName = computed(() => this.currentUser()?.displayName || 'Alex');

  readonly recentAttempts = signal<AttemptSummary[]>([]);
  readonly popularQuizzes = signal<QuizSummary[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Selected Quiz Modal
  readonly selectedQuizModal = signal<QuizSummary | null>(null);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.quizService.getMyAttempts().subscribe(atts => {
      this.recentAttempts.set(atts.slice(0, 4));
    });

    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.popularQuizzes.set(quizzes.slice(0, 6));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  playQuiz(quiz: QuizSummary): void {
    this.router.navigate(['/quiz/play', quiz.id]);
  }

  resumeAttempt(attempt: AttemptSummary): void {
    this.router.navigate(['/quiz/play', attempt.quizId]);
  }

  openQuizModal(quiz: QuizSummary): void {
    this.selectedQuizModal.set(quiz);
  }

  closeQuizModal(): void {
    this.selectedQuizModal.set(null);
  }

  isAttemptCompleted(status?: any): boolean {
    return isAttemptCompleted(status);
  }

  isAttemptInProgress(status?: any): boolean {
    return isAttemptInProgress(status);
  }

  getAccuracy(att: AttemptSummary): number {
    return calculateAccuracy(att.correctAnswers, att.totalQuestions, att.score);
  }
}

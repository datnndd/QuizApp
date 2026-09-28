import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { QuizService } from '../../core/services/quiz.service';
import {
  AttemptResult,
  AttemptSummary,
  calculateAccuracy,
  isAttemptCompleted,
  isAttemptInProgress
} from '../../core/models/quiz.models';

@Component({
  selector: 'app-recent-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './recent-quizzes.component.html',
  styleUrl: './recent-quizzes.component.css'
})
export class RecentQuizzesComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly attempts = signal<AttemptSummary[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedStatusFilter = signal<'all' | 'completed' | 'in_progress'>('all');
  readonly isLoading = signal<boolean>(true);

  // Review Modal State
  readonly reviewModalOpen = signal<boolean>(false);
  readonly selectedResult = signal<AttemptResult | null>(null);
  readonly reviewQuizTitle = signal<string>('');
  readonly isLoadingResult = signal<boolean>(false);

  readonly filteredAttempts = computed(() => {
    const list = this.attempts();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    return list.filter(item => {
      const matchQuery = !query ||
        item.quizTitle.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.quizCode.toLowerCase().includes(query);

      const matchStatus = status === 'all' ||
        (status === 'completed' && isAttemptCompleted(item.status)) ||
        (status === 'in_progress' && isAttemptInProgress(item.status));

      return matchQuery && matchStatus;
    });
  });

  ngOnInit(): void {
    this.loadAttempts();
  }

  loadAttempts(): void {
    this.isLoading.set(true);
    this.quizService.getMyAttempts().subscribe({
      next: (data) => {
        this.attempts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return 'Under 1m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  formatDate(dateString: string): string {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  openReview(attempt: AttemptSummary): void {
    this.reviewQuizTitle.set(attempt.quizTitle);
    this.isLoadingResult.set(true);
    this.reviewModalOpen.set(true);

    this.quizService.getAttemptResult(attempt.id).subscribe({
      next: (result) => {
        this.selectedResult.set(result);
        this.isLoadingResult.set(false);
      },
      error: () => {
        this.isLoadingResult.set(false);
      }
    });
  }

  closeReview(): void {
    this.reviewModalOpen.set(false);
    this.selectedResult.set(null);
  }

  retakeQuiz(attempt: AttemptSummary): void {
    this.router.navigate(['/quiz/play', attempt.quizId]);
  }

  isAttemptCompleted(status?: any): boolean {
    return isAttemptCompleted(status);
  }

  isAttemptInProgress(status?: any): boolean {
    return isAttemptInProgress(status);
  }

  getAccuracy(item: AttemptSummary | AttemptResult | null): number {
    if (!item) return 0;
    return calculateAccuracy(item.correctAnswers, item.totalQuestions, item.score);
  }

  isPassed(item: AttemptSummary | AttemptResult | null): boolean {
    return this.getAccuracy(item) >= 70;
  }
}

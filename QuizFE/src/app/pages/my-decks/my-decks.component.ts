import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { QuizService } from '../../core/services/quiz.service';
import { getQuestionTypeDisplay, QuizDetail, QuizSummary } from '../../core/models/quiz.models';

@Component({
  selector: 'app-my-decks',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-decks.component.html',
  styleUrl: './my-decks.component.css'
})
export class MyDecksComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly myQuizzes = signal<QuizSummary[]>([]);
  readonly searchQuery = signal<string>('');
  readonly expandedDeckId = signal<number | null>(null);
  readonly expandedDeckDetails = signal<Record<number, QuizDetail>>({});
  readonly isLoading = signal<boolean>(true);
  readonly isDeletingId = signal<number | null>(null);
  readonly deleteModalQuiz = signal<QuizSummary | null>(null);

  readonly filteredQuizzes = computed(() => {
    const list = this.myQuizzes();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;

    return list.filter(q =>
      q.title.toLowerCase().includes(query) ||
      q.description.toLowerCase().includes(query) ||
      q.categoryName.toLowerCase().includes(query) ||
      q.quizCode.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadDecks();
  }

  loadDecks(): void {
    this.isLoading.set(true);
    this.quizService.getMyQuizzes().subscribe({
      next: (data) => {
        this.myQuizzes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleExpand(quiz: QuizSummary): void {
    const current = this.expandedDeckId();
    if (current === quiz.id) {
      this.expandedDeckId.set(null);
      return;
    }

    this.expandedDeckId.set(quiz.id);
    if (!this.expandedDeckDetails()[quiz.id]) {
      this.quizService.getQuizById(quiz.id).subscribe(detail => {
        this.expandedDeckDetails.update(map => ({ ...map, [quiz.id]: detail }));
      });
    }
  }

  createNewDeck(): void {
    this.router.navigate(['/quiz/new']);
  }

  editDeck(quiz: QuizSummary): void {
    this.router.navigate(['/quiz/edit', quiz.id]);
  }

  playDeck(quiz: QuizSummary): void {
    this.router.navigate(['/quiz/play', quiz.id]);
  }

  confirmDelete(quiz: QuizSummary): void {
    this.deleteModalQuiz.set(quiz);
  }

  cancelDelete(): void {
    this.deleteModalQuiz.set(null);
  }

  deleteConfirmed(): void {
    const quiz = this.deleteModalQuiz();
    if (!quiz) return;

    this.isDeletingId.set(quiz.id);
    this.quizService.deleteQuiz(quiz.id).subscribe({
      next: () => {
        this.myQuizzes.update(list => list.filter(q => q.id !== quiz.id));
        this.isDeletingId.set(null);
        this.deleteModalQuiz.set(null);
      },
      error: () => {
        // Fallback remove locally
        this.myQuizzes.update(list => list.filter(q => q.id !== quiz.id));
        this.isDeletingId.set(null);
        this.deleteModalQuiz.set(null);
      }
    });
  }

  getQuestionTypeLabel(type?: any): string {
    return getQuestionTypeDisplay(type);
  }
}

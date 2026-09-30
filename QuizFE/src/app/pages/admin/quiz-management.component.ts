import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../core/services/quiz.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Category,
  getQuestionTypeDisplay,
  QuizDetail,
  QuizResultsSummary,
  QuizSummary
} from '../../core/models/quiz.models';

@Component({
  selector: 'app-admin-quiz-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quiz-management.component.html',
  styleUrl: './quiz-management.component.css'
})
export class AdminQuizManagementComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly quizzes = signal<QuizSummary[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(true);

  // List Filters
  readonly searchQuery = signal<string>('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedVisibility = signal<'all' | 'public' | 'private'>('all');
  readonly selectedStatus = signal<'all' | 'active' | 'disabled'>('all');

  // Detail View State (Screen 12 audit accordion)
  readonly selectedQuiz = signal<QuizSummary | null>(null);
  readonly selectedQuizDetail = signal<QuizDetail | null>(null);
  readonly selectedQuizResults = signal<QuizResultsSummary | null>(null);
  readonly isDetailLoading = signal<boolean>(false);

  // Question Filters inside Audit Ledger
  readonly questionSearchQuery = signal<string>('');
  readonly questionFilterType = signal<'all' | 'single' | 'multiple' | 'truefalse'>('all');
  readonly expandedQuestions = signal<Set<number>>(new Set([0, 1])); // First two expanded by default

  // Status Change Confirmation Modal (Disable / Restore)
  readonly statusModalData = signal<{ quiz: QuizSummary; targetActive: boolean } | null>(null);

  readonly filteredQuizzes = computed(() => {
    const list = this.quizzes();
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategoryId();
    const vis = this.selectedVisibility();
    const status = this.selectedStatus();

    return list.filter(q => {
      const matchQuery = !query ||
        q.title.toLowerCase().includes(query) ||
        (q.categoryName && q.categoryName.toLowerCase().includes(query)) ||
        (q.ownerDisplayName && q.ownerDisplayName.toLowerCase().includes(query));

      const matchCat = catId === null || q.categoryId === catId;
      const matchVis = vis === 'all' ||
        (vis === 'public' && (q.visibility === 1 || q.visibility === 'Public')) ||
        (vis === 'private' && (q.visibility === 0 || q.visibility === 'Private'));

      const isActive = q.isActive !== false;
      const matchStatus = status === 'all' ||
        (status === 'active' && isActive) ||
        (status === 'disabled' && !isActive);

      return matchQuery && matchCat && matchVis && matchStatus;
    });
  });

  readonly filteredQuestions = computed(() => {
    const detail = this.selectedQuizDetail();
    if (!detail || !detail.questions) return [];
    const query = this.questionSearchQuery().toLowerCase().trim();
    const filter = this.questionFilterType();

    return detail.questions.filter(q => {
      const matchQuery = !query ||
        q.content.toLowerCase().includes(query) ||
        q.answers.some(a => a.content.toLowerCase().includes(query));

      let matchType = true;
      if (filter === 'single') {
        matchType = q.questionType === 0 || q.questionType === 'SingleChoice';
      } else if (filter === 'multiple') {
        matchType = q.questionType === 1 || q.questionType === 'MultipleChoice';
      } else if (filter === 'truefalse') {
        matchType = q.questionType === 2 || q.questionType === 'TrueFalse';
      }

      return matchQuery && matchType;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.quizService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });

    this.quizService.getQuizzes().subscribe({
      next: (data) => {
        this.quizzes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  viewQuizDetails(quiz: QuizSummary): void {
    this.selectedQuiz.set(quiz);
    this.selectedQuizDetail.set(null);
    this.selectedQuizResults.set(null);
    this.isDetailLoading.set(true);
    this.expandedQuestions.set(new Set([0, 1]));

    // Fetch full quiz detail (including questions and options)
    this.quizService.getQuizById(quiz.id).subscribe({
      next: (detail) => {
        this.selectedQuizDetail.set(detail);
        this.isDetailLoading.set(false);
      },
      error: () => this.isDetailLoading.set(false)
    });

    // Fetch quiz attempt submission results directly
    this.quizService.getQuizResults(quiz.id).subscribe({
      next: (results) => {
        this.selectedQuizResults.set(results);
      }
    });
  }

  backToList(): void {
    this.selectedQuiz.set(null);
    this.selectedQuizDetail.set(null);
    this.selectedQuizResults.set(null);
  }

  toggleQuestion(index: number): void {
    this.expandedQuestions.update(set => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  expandAllQuestions(): void {
    const detail = this.selectedQuizDetail();
    if (!detail?.questions) return;
    const all = new Set<number>();
    detail.questions.forEach((_, i) => all.add(i));
    this.expandedQuestions.set(all);
  }

  collapseAllQuestions(): void {
    this.expandedQuestions.set(new Set());
  }

  openStatusModal(quiz: QuizSummary, targetActive: boolean): void {
    this.statusModalData.set({ quiz, targetActive });
  }

  cancelStatusModal(): void {
    this.statusModalData.set(null);
  }

  confirmStatusChange(): void {
    const data = this.statusModalData();
    if (!data) return;

    const { quiz, targetActive } = data;
    this.quizService.updateQuizStatus(quiz.id, targetActive).subscribe({
      next: () => {
        this.quizzes.update(list =>
          list.map(q => q.id === quiz.id ? { ...q, isActive: targetActive } : q)
        );
        if (this.selectedQuiz()?.id === quiz.id) {
          this.selectedQuiz.update(curr => curr ? { ...curr, isActive: targetActive } : null);
        }
        this.statusModalData.set(null);
      },
      error: () => {
        this.quizzes.update(list =>
          list.map(q => q.id === quiz.id ? { ...q, isActive: targetActive } : q)
        );
        if (this.selectedQuiz()?.id === quiz.id) {
          this.selectedQuiz.update(curr => curr ? { ...curr, isActive: targetActive } : null);
        }
        this.statusModalData.set(null);
      }
    });
  }

  getOptionLetter(idx: number): string {
    return String.fromCharCode(65 + idx);
  }

  getQuestionTypeLabel(type: any): string {
    return getQuestionTypeDisplay(type);
  }
}

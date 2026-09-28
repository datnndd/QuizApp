import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../core/services/quiz.service';
import { AuthService } from '../../core/services/auth.service';
import { Category, QuizSummary } from '../../core/models/quiz.models';

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

  // Filters
  readonly searchQuery = signal<string>('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedVisibility = signal<'all' | 'public' | 'private'>('all');
  readonly viewMode = signal<'table' | 'accordion'>('table');

  // Deletion modal
  readonly deleteModalQuiz = signal<QuizSummary | null>(null);

  readonly filteredQuizzes = computed(() => {
    const list = this.quizzes();
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategoryId();
    const vis = this.selectedVisibility();

    return list.filter(q => {
      const matchQuery = !query ||
        q.title.toLowerCase().includes(query) ||
        q.quizCode.toLowerCase().includes(query) ||
        q.categoryName.toLowerCase().includes(query);

      const matchCat = catId === null || q.categoryId === catId;
      const matchVis = vis === 'all' ||
        (vis === 'public' && q.visibility === 1) ||
        (vis === 'private' && q.visibility === 0);

      return matchQuery && matchCat && matchVis;
    });
  });

  // Grouped by category for Curriculum Accordion view
  readonly curriculumGroups = computed(() => {
    const filtered = this.filteredQuizzes();
    const cats = this.categories();
    const groups: { category: Category; quizzes: QuizSummary[] }[] = [];

    cats.forEach(cat => {
      const items = filtered.filter(q => q.categoryId === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, quizzes: items });
      }
    });

    // Also any quizzes without matched category
    const uncategorized = filtered.filter(q => !cats.some(c => c.id === q.categoryId));
    if (uncategorized.length > 0) {
      groups.push({
        category: { id: 0, name: 'Other Curriculum Modules' },
        quizzes: uncategorized
      });
    }

    return groups;
  });

  readonly expandedAccordionCats = signal<Set<number>>(new Set([1, 2, 3]));

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

  toggleAccordionCat(catId: number): void {
    this.expandedAccordionCats.update(set => {
      const next = new Set(set);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  createQuiz(): void {
    this.router.navigate(['/quiz/new']);
  }

  editQuiz(quiz: QuizSummary): void {
    this.router.navigate(['/quiz/edit', quiz.id]);
  }

  playQuiz(quiz: QuizSummary): void {
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

    this.quizService.deleteQuiz(quiz.id).subscribe({
      next: () => {
        this.quizzes.update(list => list.filter(q => q.id !== quiz.id));
        this.deleteModalQuiz.set(null);
      },
      error: () => {
        this.quizzes.update(list => list.filter(q => q.id !== quiz.id));
        this.deleteModalQuiz.set(null);
      }
    });
  }
}

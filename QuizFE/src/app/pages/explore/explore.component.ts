import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { QuizService } from '../../core/services/quiz.service';
import { Category, QuizSummary } from '../../core/models/quiz.models';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css'
})
export class ExploreComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly quizzes = signal<QuizSummary[]>([]);
  readonly selectedCategoryId = signal<number | null>(null);
  readonly searchQuery = signal<string>('');
  readonly selectedQuiz = signal<QuizSummary | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly filteredQuizzes = computed(() => {
    const list = this.quizzes();
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter(quiz => {
      const matchCat = catId === null || quiz.categoryId === catId;
      const matchQuery = !query ||
        quiz.title.toLowerCase().includes(query) ||
        quiz.description.toLowerCase().includes(query) ||
        quiz.categoryName.toLowerCase().includes(query) ||
        this.getAuthorName(quiz).toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  getAuthorName(quiz?: QuizSummary | null): string {
    if (!quiz) return 'Staff Curator';
    const name = quiz.ownerDisplayName || quiz.ownerName;
    return name && name.trim().length > 0 ? name.trim() : 'Staff Curator';
  }

  getAuthorInitial(quiz?: QuizSummary | null): string {
    const name = this.getAuthorName(quiz);
    return name ? name.charAt(0).toUpperCase() : 'Q';
  }

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
        if (data.length > 0 && !this.selectedQuiz()) {
          this.selectedQuiz.set(data[0]);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    const filtered = this.filteredQuizzes();
    if (filtered.length > 0) {
      this.selectedQuiz.set(filtered[0]);
    }
  }

  selectQuiz(quiz: QuizSummary): void {
    this.selectedQuiz.set(quiz);
  }

  startQuiz(quiz: QuizSummary): void {
    this.router.navigate(['/quiz/play', quiz.id]);
  }
}

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ExploreComponent } from './explore.component';
import { QuizService } from '../../core/services/quiz.service';

const mockQuizService = {
  getCategories: () => of([
    { id: 1, name: 'Science & Physics' }
  ]),
  getQuizzes: () => of([
    {
      id: 1,
      title: 'Solar System & Planetary Physics',
      description: 'Deep space mechanics...',
      quizCode: 'ASTRO9',
      duration: 15,
      maxAttempts: 3,
      visibility: 1 as const,
      categoryId: 1,
      categoryName: 'Science & Physics',
      ownerDisplayName: 'Dr. Stella Vance',
      ownerName: 'Dr. Stella Vance',
      questionCount: 12,
      createdAt: '',
      updatedAt: ''
    }
  ])
};

describe('ExploreComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: QuizService, useValue: mockQuizService }
      ]
    }).compileComponents();
  });

  it('should create the explore component', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should filter quizzes by search query', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchQuery.set('Solar');
    expect(component.filteredQuizzes().length).toBeGreaterThan(0);
    expect(component.filteredQuizzes()[0].title).toContain('Solar');
  });

  it('should select quiz into inspector', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const quiz = component.quizzes()[0];
    if (quiz) {
      component.selectQuiz(quiz);
      expect(component.selectedQuiz()?.id).toBe(quiz.id);
    }
  });

  it('should not filter quizzes by quizCode', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchQuery.set('ASTRO9');
    expect(component.filteredQuizzes().length).toBe(0);
  });

  it('should correctly format author name and initial', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;

    expect(component.getAuthorName({ ownerDisplayName: 'Dr. Stella Vance' } as any)).toBe('Dr. Stella Vance');
    expect(component.getAuthorInitial({ ownerDisplayName: 'Dr. Stella Vance' } as any)).toBe('D');
    expect(component.getAuthorName({ ownerName: 'Marcus Brody' } as any)).toBe('Marcus Brody');
    expect(component.getAuthorInitial({ ownerName: 'Marcus Brody' } as any)).toBe('M');
    expect(component.getAuthorName({} as any)).toBe('Staff Curator');
    expect(component.getAuthorInitial({} as any)).toBe('S');
  });

  it('should paginate explore quizzes and reset page on category or search change', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Generate 14 sample quizzes
    const sampleQuizzes: any[] = Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      title: `Quiz ${i + 1}`,
      description: `Description ${i + 1}`,
      categoryId: i % 2 === 0 ? 1 : 2,
      categoryName: i % 2 === 0 ? 'Science' : 'Art',
      duration: 10,
      questionCount: 5,
      visibility: 1
    }));
    component.quizzes.set(sampleQuizzes);

    expect(component.pageSize()).toBe(6);
    expect(component.totalPages()).toBe(3); // 14 items / 6 = 3 pages
    expect(component.paginatedQuizzes().length).toBe(6);
    expect(component.paginatedQuizzes()[0].id).toBe(1);

    // Go to next page
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedQuizzes()[0].id).toBe(7);

    // Go to last page
    component.goToPage(3);
    expect(component.currentPage()).toBe(3);
    expect(component.paginatedQuizzes().length).toBe(2);

    // Filtering category resets to page 1
    component.selectCategory(1);
    expect(component.currentPage()).toBe(1);
  });
});

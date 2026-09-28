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
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminQuizManagementComponent } from './quiz-management.component';
import { QuizSummary } from '../../core/models/quiz.models';

describe('AdminQuizManagementComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminQuizManagementComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create admin quiz management component', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should transition between table list and quiz detail view', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;
    expect(component.selectedQuiz()).toBeNull();

    const sampleQuiz: QuizSummary = {
      id: 101,
      title: 'Cellular Biology',
      description: 'Core concepts',
      duration: 30,
      maxAttempts: 3,
      visibility: 1,
      categoryId: 2,
      categoryName: 'Science',
      questionCount: 10,
      isActive: true,
      createdAt: '2026-09-01',
      updatedAt: '2026-09-02'
    };

    component.viewQuizDetails(sampleQuiz);
    expect(component.selectedQuiz()?.id).toBe(101);

    component.backToList();
    expect(component.selectedQuiz()).toBeNull();
  });

  it('should filter quizzes by status (active vs disabled)', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;

    component.quizzes.set([
      {
        id: 1,
        title: 'Active Quiz',
        description: 'Test',
        duration: 10,
        maxAttempts: 1,
        visibility: 1,
        categoryId: 1,
        categoryName: 'Math',
        questionCount: 5,
        isActive: true,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-02'
      },
      {
        id: 2,
        title: 'Disabled Quiz',
        description: 'Test',
        duration: 15,
        maxAttempts: 2,
        visibility: 1,
        categoryId: 1,
        categoryName: 'Math',
        questionCount: 8,
        isActive: false,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-02'
      }
    ]);

    component.selectedStatus.set('active');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].id).toBe(1);

    component.selectedStatus.set('disabled');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].id).toBe(2);

    component.selectedStatus.set('all');
    expect(component.filteredQuizzes().length).toBe(2);
  });

  it('should open and cancel status modal', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;

    const sampleQuiz: QuizSummary = {
      id: 201,
      title: 'Physics Mechanics',
      description: 'Motion and energy',
      duration: 45,
      maxAttempts: 2,
      visibility: 1,
      categoryId: 2,
      categoryName: 'Science',
      questionCount: 12,
      isActive: true,
      createdAt: '2026-09-01',
      updatedAt: '2026-09-02'
    };

    component.openStatusModal(sampleQuiz, false);
    expect(component.statusModalData()).toEqual({ quiz: sampleQuiz, targetActive: false });

    component.cancelStatusModal();
    expect(component.statusModalData()).toBeNull();
  });
});

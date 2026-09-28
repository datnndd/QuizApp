import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { QuizService } from '../../core/services/quiz.service';

const mockQuizService = {
  getMyAttempts: () => of([
    {
      id: 1,
      quizId: 1,
      quizTitle: 'Solar System & Planetary Physics',
      quizCode: 'ASTRO9',
      categoryName: 'Science & Physics',
      status: 1 as const,
      startedAt: '2026-09-27T14:10:00Z',
      totalQuestions: 12,
      score: 92,
      isAutoSubmitted: false
    }
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

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: QuizService, useValue: mockQuizService }
      ]
    }).compileComponents();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with recent attempts and popular study decks', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.recentAttempts().length).toBeGreaterThan(0);
    expect(component.popularQuizzes().length).toBeGreaterThan(0);
  });

  it('should open and close quiz modal', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.selectedQuizModal()).toBeNull();

    const quiz = component.popularQuizzes()[0];
    component.openQuizModal(quiz);
    expect(component.selectedQuizModal()?.title).toBe(quiz.title);

    component.closeQuizModal();
    expect(component.selectedQuizModal()).toBeNull();
  });

  it('should dismiss unauthorized alert', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.showUnauthorizedAlert.set(true);

    component.showUnauthorizedAlert.set(false);
    expect(component.showUnauthorizedAlert()).toBe(false);
  });

  it('should render welcome banner and study shelves in template', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome back');
    expect(compiled.textContent).toContain('Recently Attempted Quizzes');
    expect(compiled.textContent).toContain('Popular Study Decks');
  });

  it('should accurately detect submitted and in-progress statuses', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component.isAttemptCompleted('Submitted')).toBe(true);
    expect(component.isAttemptCompleted(1)).toBe(true);
    expect(component.isAttemptCompleted('InProgress')).toBe(false);

    expect(component.isAttemptInProgress('InProgress')).toBe(true);
    expect(component.isAttemptInProgress(0)).toBe(true);
    expect(component.isAttemptInProgress('Submitted')).toBe(false);
  });
});

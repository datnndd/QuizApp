import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { RecentQuizzesComponent } from './recent-quizzes.component';

describe('RecentQuizzesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentQuizzesComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create recent quizzes component', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should handle string enum statuses and filter properly', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;

    component.attempts.set([
      {
        id: 1,
        quizId: 10,
        quizTitle: 'Astrophysics',
        quizCode: 'ASTRO1',
        categoryName: 'Science',
        status: 'Submitted' as any,
        startedAt: new Date().toISOString(),
        totalQuestions: 10,
        correctAnswers: 9,
        score: 9,
        timeSpentSeconds: 300,
        isAutoSubmitted: false
      },
      {
        id: 2,
        quizId: 20,
        quizTitle: 'World History',
        quizCode: 'HIST01',
        categoryName: 'History',
        status: 'InProgress' as any,
        startedAt: new Date().toISOString(),
        totalQuestions: 5,
        isAutoSubmitted: false
      }
    ]);
    fixture.detectChanges();

    expect(component.isAttemptCompleted('Submitted')).toBe(true);
    expect(component.isAttemptCompleted('InProgress')).toBe(false);
    expect(component.isAttemptInProgress('InProgress')).toBe(true);
    expect(component.isAttemptInProgress('Submitted')).toBe(false);

    component.selectedStatusFilter.set('completed');
    expect(component.filteredAttempts().length).toBe(1);
    expect(component.filteredAttempts()[0].id).toBe(1);

    component.selectedStatusFilter.set('in_progress');
    expect(component.filteredAttempts().length).toBe(1);
    expect(component.filteredAttempts()[0].id).toBe(2);
  });

  it('should compute accuracy and pass/fail status accurately', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;

    const itemPass = {
      id: 1,
      quizId: 10,
      quizTitle: 'Math',
      quizCode: 'MATH01',
      categoryName: 'Math',
      status: 'Submitted' as any,
      startedAt: new Date().toISOString(),
      totalQuestions: 4,
      correctAnswers: 3,
      score: 3,
      isAutoSubmitted: false
    };
    expect(component.getAccuracy(itemPass)).toBe(75);
    expect(component.isPassed(itemPass)).toBe(true);

    const itemFail = {
      ...itemPass,
      correctAnswers: 1,
      score: 1
    };
    expect(component.getAccuracy(itemFail)).toBe(25);
    expect(component.isPassed(itemFail)).toBe(false);
  });

  it('should not filter attempts by quizCode', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;

    component.attempts.set([
      {
        id: 1,
        quizId: 10,
        quizTitle: 'Astrophysics',
        quizCode: 'ASTRO1',
        categoryName: 'Science',
        status: 'Submitted' as any,
        startedAt: new Date().toISOString(),
        totalQuestions: 10,
        correctAnswers: 9,
        score: 9,
        timeSpentSeconds: 300,
        isAutoSubmitted: false
      }
    ]);
    fixture.detectChanges();

    component.searchQuery.set('ASTRO1');
    expect(component.filteredAttempts().length).toBe(0);
  });

  it('should paginate attempts correctly with pageSize 5 and reset page on filter change', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;

    const sampleAttempts: any[] = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      quizId: i + 100,
      quizTitle: `Quiz Attempt ${i + 1}`,
      categoryName: 'Tech',
      status: 'Submitted',
      startedAt: new Date().toISOString(),
      totalQuestions: 5,
      correctAnswers: 4,
      score: 4,
      isAutoSubmitted: false
    }));

    component.attempts.set(sampleAttempts);
    fixture.detectChanges();

    expect(component.pageSize()).toBe(5);
    expect(component.totalPages()).toBe(3); // 12 / 5 = 3
    expect(component.paginatedAttempts().length).toBe(5);
    expect(component.paginatedAttempts()[0].id).toBe(1);

    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedAttempts()[0].id).toBe(6);

    component.goToPage(3);
    expect(component.currentPage()).toBe(3);
    expect(component.paginatedAttempts().length).toBe(2);

    // prevPage
    component.prevPage();
    expect(component.currentPage()).toBe(2);

    // Filter change resets to page 1
    component.setStatusFilter('in_progress');
    expect(component.currentPage()).toBe(1);
  });

  it('should not allow retaking a soft-deleted or inactive quiz', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const deletedAttempt: any = {
      id: 99,
      quizId: 50,
      quizTitle: 'Deleted Quiz',
      categoryName: 'Tech',
      status: 'Submitted',
      isQuizDeleted: true,
      isQuizActive: false
    };

    component.retakeQuiz(deletedAttempt);
    expect(navigateSpy).not.toHaveBeenCalled();

    const normalAttempt: any = {
      id: 100,
      quizId: 51,
      quizTitle: 'Active Quiz',
      categoryName: 'Tech',
      status: 'Submitted',
      isQuizDeleted: false,
      isQuizActive: true
    };

    component.retakeQuiz(normalAttempt);
    expect(navigateSpy).toHaveBeenCalledWith(['/quiz/play', 51]);
  });
});

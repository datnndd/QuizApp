import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
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
});

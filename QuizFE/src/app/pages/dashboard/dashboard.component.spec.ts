import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with 3 recent attempts and 3 popular quizzes', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component['recentAttempts']().length).toBe(3);
    expect(component['popularQuizzes']().length).toBe(3);
    expect(component['weeklyCompletedCount']()).toBe(3);
  });

  it('should open and close quiz modal', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component['isModalOpen']()).toBe(false);

    const quiz = component['popularQuizzes']()[0];
    component.openQuizModal(quiz);
    expect(component['isModalOpen']()).toBe(true);
    expect(component['selectedQuiz']()?.title).toBe('Solar System & Planetary Orbits');

    component.closeQuizModal();
    expect(component['isModalOpen']()).toBe(false);
    expect(component['selectedQuiz']()).toBeNull();
  });

  it('should switch active tab correctly', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component['activeTab']()).toBe('dashboard');

    component.setActiveTab('recent');
    expect(component['activeTab']()).toBe('recent');

    component.setActiveTab('explore');
    expect(component['activeTab']()).toBe('explore');
  });

  it('should dismiss unauthorized alert', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component['showUnauthorizedAlert'].set(true);

    component.dismissUnauthorizedAlert();
    expect(component['showUnauthorizedAlert']()).toBe(false);
  });

  it('should render user information and welcome banner in template', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome back');
    expect(compiled.textContent).toContain('Recently Attempted Quizzes');
    expect(compiled.textContent).toContain('Popular Quizzes');
    expect(compiled.textContent).toContain('Solar System & Planetary Physics');
  });
});

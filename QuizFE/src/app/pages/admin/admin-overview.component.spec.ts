import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminOverviewComponent } from './admin-overview.component';

describe('AdminOverviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOverviewComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the admin overview component', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with 4 KPIs and default filters', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;
    expect(component.kpis().length).toBe(4);
    expect(component.timeframe()).toBe('today');
    expect(component.userFilter()).toBe('all');
    expect(component.quizDomain()).toBe('all');
  });

  it('should filter users by role category correctly', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;

    component.setUserFilter('students');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Alex Morgan');

    component.setUserFilter('educators');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Dr. Elena Rostova');

    component.setUserFilter('admins');
    expect(component.filteredUsers().length).toBe(2);
  });

  it('should search users by name or email', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;

    component.userSearchQuery.set('Marcus');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Marcus Chen');

    component.userSearchQuery.set('oxford');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Sarah Jenkins');
  });

  it('should filter quizzes by domain', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;

    component.setQuizDomain('astrophysics');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].title).toBe('Solar System Mechanics & Deep Space');

    component.setQuizDomain('cs');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].title).toBe('Modern Web Architecture & CSS');
  });

  it('should approve a pending deck', () => {
    const fixture = TestBed.createComponent(AdminOverviewComponent);
    const component = fixture.componentInstance;

    const pendingDeck = component.quizzes().find((q) => q.id === 'q-1');
    expect(pendingDeck?.isPendingApproval).toBe(true);

    component.approveDeck('q-1');
    const updatedDeck = component.quizzes().find((q) => q.id === 'q-1');
    expect(updatedDeck?.isPendingApproval).toBe(false);
    expect(updatedDeck?.statusBadge).toBe('Published Live');
  });
});

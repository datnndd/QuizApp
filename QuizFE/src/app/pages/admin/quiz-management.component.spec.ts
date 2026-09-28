import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminQuizManagementComponent } from './quiz-management.component';

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

  it('should switch between clean table and curriculum accordion view modes', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;
    expect(component.viewMode()).toBe('table');

    component.viewMode.set('accordion');
    expect(component.viewMode()).toBe('accordion');
  });

  it('should filter quizzes by visibility', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectedVisibility.set('public');
    const publicList = component.filteredQuizzes();
    expect(publicList.every(q => q.visibility === 1)).toBe(true);
  });

  it('should not filter quizzes by quizCode', () => {
    const fixture = TestBed.createComponent(AdminQuizManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchQuery.set('ASTRO9');
    expect(component.filteredQuizzes().length).toBe(0);
  });
});

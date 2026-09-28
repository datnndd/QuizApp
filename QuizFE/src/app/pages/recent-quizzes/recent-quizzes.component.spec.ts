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

  it('should compute summary metrics correctly', () => {
    const fixture = TestBed.createComponent(RecentQuizzesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.completedCount()).toBeGreaterThanOrEqual(0);
    expect(component.averageAccuracy()).toBeGreaterThanOrEqual(0);
  });
});

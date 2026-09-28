import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { QuizPlayerComponent } from './quiz-player.component';

describe('QuizPlayerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizPlayerComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create quiz player component', () => {
    const fixture = TestBed.createComponent(QuizPlayerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should navigate questions and toggle flags', () => {
    const fixture = TestBed.createComponent(QuizPlayerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.currentQuestionIndex()).toBe(0);
    component.toggleFlagCurrentQuestion();
    expect(component.isQuestionFlagged(0)).toBe(true);

    component.toggleFlagCurrentQuestion();
    expect(component.isQuestionFlagged(0)).toBe(false);
  });
});

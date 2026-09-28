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

  it('should enforce single-choice selection for True/False questions', () => {
    const fixture = TestBed.createComponent(QuizPlayerComponent);
    const component = fixture.componentInstance;

    component.attempt.set({
      id: 999,
      quizId: 1,
      quizTitle: 'True/False Test Quiz',
      status: 'InProgress',
      startedAt: new Date().toISOString(),
      isAutoSubmitted: false,
      questions: [
        {
          attemptQuestionId: 1,
          questionId: 101,
          questionVersionId: 201,
          order: 1,
          content: 'Water boils at 100 degrees Celsius at sea level.',
          questionType: 2,
          answers: [
            { id: 1, content: 'True' },
            { id: 2, content: 'False' }
          ],
          selectedAnswerIds: []
        }
      ]
    });
    fixture.detectChanges();

    expect(component.currentQuestion()?.content).toContain('Water boils');
    expect(component.isTrueFalse(component.currentQuestion()?.questionType)).toBe(true);

    // Select True
    component.toggleAnswer(1);
    expect(component.isAnswerSelected(1)).toBe(true);
    expect(component.isAnswerSelected(2)).toBe(false);

    // Switch to False
    component.toggleAnswer(2);
    expect(component.isAnswerSelected(1)).toBe(false);
    expect(component.isAnswerSelected(2)).toBe(true);
  });

  it('should correctly evaluate accuracy and passed status', () => {
    const fixture = TestBed.createComponent(QuizPlayerComponent);
    const component = fixture.componentInstance;

    const passedResult = {
      attemptId: 1,
      score: 4,
      totalQuestions: 5,
      correctAnswers: 4,
      incorrectAnswers: 1,
      timeSpentSeconds: 120,
      isAutoSubmitted: false,
      questions: []
    };
    expect(component.getAccuracy(passedResult)).toBe(80);
    expect(component.isPassed(passedResult)).toBe(true);

    const failedResult = {
      attemptId: 2,
      score: 2,
      totalQuestions: 5,
      correctAnswers: 2,
      incorrectAnswers: 3,
      timeSpentSeconds: 120,
      isAutoSubmitted: false,
      questions: []
    };
    expect(component.getAccuracy(failedResult)).toBe(40);
    expect(component.isPassed(failedResult)).toBe(false);
  });
});

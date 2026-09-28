import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EditQuizComponent } from './edit-quiz.component';
import { QuizService } from '../../core/services/quiz.service';

describe('EditQuizComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditQuizComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create edit quiz component', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize a new quiz with zero sample questions', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isNew()).toBe(true);
    expect(component.questions().length).toBe(0);
  });

  it('should add question and options', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const initialCount = component.questions().length;
    component.addQuestion();
    expect(component.questions().length).toBe(initialCount + 1);
  });

  it('should add True/False question directly with two options', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.addQuestion(2);
    expect(component.questions().length).toBe(1);

    const q = component.activeQuestion();
    expect(q).toBeTruthy();
    expect(component.isTrueFalse(q!.questionType)).toBe(true);
    expect(q!.answers.length).toBe(2);
    expect(q!.answers[0].content).toBe('True');
    expect(q!.answers[0].isCorrect).toBe(true);
    expect(q!.answers[1].content).toBe('False');
    expect(q!.answers[1].isCorrect).toBe(false);
  });

  it('should enforce single-choice behavior when toggling True/False answer correctness', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.addQuestion(2);
    const q = component.activeQuestion()!;

    // Toggle False to be correct
    component.toggleAnswerCorrect(1);
    expect(q.answers[0].isCorrect).toBe(false);
    expect(q.answers[1].isCorrect).toBe(true);

    // Toggle True back to be correct
    component.toggleAnswerCorrect(0);
    expect(q.answers[0].isCorrect).toBe(true);
    expect(q.answers[1].isCorrect).toBe(false);
  });

  it('should prevent adding and removing options on True/False questions', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.addQuestion(2);
    const q = component.activeQuestion()!;

    component.addAnswerOption();
    expect(q.answers.length).toBe(2);

    component.removeAnswerOption(0);
    expect(q.answers.length).toBe(2);
  });

  it('should configure True/False options when switching question type', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.addQuestion(0); // Add single choice with 3 options
    const q = component.activeQuestion()!;
    expect(q.answers.length).toBe(3);

    component.setQuestionType(2);
    expect(component.isTrueFalse(q.questionType)).toBe(true);
    expect(q.answers.length).toBe(2);
    expect(q.answers.filter(a => a.isCorrect).length).toBe(1);
  });

  it('should call createQuiz with valid payload when saving a new deck', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const quizService = TestBed.inject(QuizService);
    let capturedPayload: any;
    vi.spyOn(quizService, 'createQuiz').mockImplementation((p: any) => {
      capturedPayload = p;
      return of({} as any);
    });

    component.saveQuiz();
    expect(capturedPayload).toBeTruthy();
    expect(capturedPayload.title).toBe('Custom Study Deck');
  });

  it('should call updateQuiz with correct id and payload when updating an existing deck', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    const quizService = TestBed.inject(QuizService);

    vi.spyOn(quizService, 'getQuizById').mockReturnValue(of({
      id: 42,
      title: 'Existing Deck',
      description: 'Desc',
      categoryId: 2,
      duration: 20,
      maxAttempts: 2,
      visibility: 1,
      questions: []
    } as any));

    component.loadQuiz(42);
    expect(component.title()).toBe('Existing Deck');

    let updatedPayload: any;
    let updatedId: any;
    vi.spyOn(quizService, 'updateQuiz').mockImplementation((id: number, p: any) => {
      updatedId = id;
      updatedPayload = p;
      return of({} as any);
    });

    component.saveQuiz();
    expect(updatedId).toBe(42);
    expect(updatedPayload).toBeTruthy();
    expect(updatedPayload.title).toBe('Existing Deck');
  });
});


import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { EditQuizComponent } from './edit-quiz.component';

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
});

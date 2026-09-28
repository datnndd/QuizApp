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

  describe('Question Bank Modal & Import/Duplication Features', () => {
    it('should open and close question bank modal and reset selection', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isBankModalOpen()).toBe(false);

      component.openBankModal();
      expect(component.isBankModalOpen()).toBe(true);
      expect(component.bankSearchQuery()).toBe('');
      expect(component.selectedBankQuestionIds().size).toBe(0);

      component.toggleBankQuestionSelection(101);
      expect(component.selectedBankQuestionIds().has(101)).toBe(true);

      component.closeBankModal();
      expect(component.isBankModalOpen()).toBe(false);
      expect(component.selectedBankQuestionIds().size).toBe(0);
    });

    it('should automatically pre-filter category dropdown to current Quiz category by default', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.categoryId.set(3);
      component.openBankModal();
      expect(component.bankCategoryFilter()).toBe(3);

      component.bankQuestions.set([
        { id: 1, categoryId: 3, categoryName: 'Geography', content: 'Capital of Liechtenstein', questionType: 0, publicQuizCount: 1 } as any,
        { id: 2, categoryId: 1, categoryName: 'Science', content: 'Speed of Light', questionType: 0, publicQuizCount: 2 } as any
      ]);

      const filtered = component.filteredBankQuestions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(1);

      component.bankCategoryFilter.set('all');
      expect(component.filteredBankQuestions().length).toBe(2);
    });

    it('should filter questions by search query in real-time', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.bankCategoryFilter.set('all');
      component.bankQuestions.set([
        { id: 1, categoryId: 1, categoryName: 'Science', content: 'What is photosynthesis?', questionType: 0, publicQuizCount: 1 } as any,
        { id: 2, categoryId: 1, categoryName: 'Science', content: 'Explain cellular respiration.', questionType: 0, publicQuizCount: 2 } as any
      ]);

      component.bankSearchQuery.set('photosynthesis');
      expect(component.filteredBankQuestions().length).toBe(1);
      expect(component.filteredBankQuestions()[0].id).toBe(1);

      component.bankSearchQuery.set('nonexistent');
      expect(component.filteredBankQuestions().length).toBe(0);
    });

    it('should toggle answer preview and fetch details when not cached', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      const quizService = TestBed.inject(QuizService);
      fixture.detectChanges();

      const testQ: any = {
        id: 99,
        categoryId: 1,
        categoryName: 'Science',
        content: 'Is Pluto a dwarf planet?',
        questionType: 2
      };

      vi.spyOn(quizService, 'getQuestionDetail').mockReturnValue(of({
        id: 99,
        content: 'Is Pluto a dwarf planet?',
        questionType: 2,
        versions: [
          {
            id: 199,
            versionNumber: 1,
            content: 'Is Pluto a dwarf planet?',
            questionType: 2,
            isCurrent: true,
            answers: [
              { id: 1, content: 'True', isCorrect: true },
              { id: 2, content: 'False', isCorrect: false }
            ]
          }
        ]
      } as any));

      expect(component.isAnswerPreviewExpanded(99)).toBe(false);

      // Expand preview: triggers detail fetch
      component.toggleAnswerPreview(testQ);
      expect(component.isAnswerPreviewExpanded(99)).toBe(true);

      const cached = component.getQuestionAnswers(testQ);
      expect(cached).toBeTruthy();
      expect(cached!.length).toBe(2);
      expect(cached![0].content).toBe('True');
      expect(cached![0].isCorrect).toBe(true);

      // Toggle again to collapse
      component.toggleAnswerPreview(testQ);
      expect(component.isAnswerPreviewExpanded(99)).toBe(false);
    });

    it('should clone single question with independent IDs, answers, and set active', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.openBankModal();
      expect(component.isBankModalOpen()).toBe(true);

      const bankQ: any = {
        id: 42,
        categoryId: 2,
        categoryName: 'Technology',
        content: 'What is an event loop?',
        questionType: 0,
        answers: [
          { id: 10, content: 'Asynchronous concurrency mechanism', isCorrect: true },
          { id: 20, content: 'Multithreading CPU bus', isCorrect: false }
        ]
      };

      component.importSingleQuestion(bankQ);

      expect(component.isBankModalOpen()).toBe(false);
      expect(component.questions().length).toBe(1);

      const imported = component.questions()[0];
      expect(imported.content).toBe('What is an event loop?');
      expect(imported.id).not.toBe(42);
      expect(imported.answers.length).toBe(2);
      expect(imported.answers[0].id).not.toBe(10);
      expect(imported.answers[0].content).toBe('Asynchronous concurrency mechanism');
      expect(imported.answers[0].isCorrect).toBe(true);
      expect(component.activeQuestionIndex()).toBe(0);
      expect(component.activeQuestion()).toBe(imported);

      // Modifying cloned question should not mutate original bank question
      imported.answers[0].content = 'Modified concurrency explanation';
      expect(bankQ.answers[0].content).toBe('Asynchronous concurrency mechanism');
    });

    it('should bulk import multiple selected questions with independent IDs and select the last', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.openBankModal();

      const q1: any = {
        id: 101,
        categoryId: 1,
        content: 'Bulk Q1',
        questionType: 0,
        answers: [{ id: 1, content: 'Opt 1', isCorrect: true }, { id: 2, content: 'Opt 2', isCorrect: false }]
      };
      const q2: any = {
        id: 102,
        categoryId: 1,
        content: 'Bulk Q2',
        questionType: 1,
        answers: [{ id: 3, content: 'Opt 3', isCorrect: true }, { id: 4, content: 'Opt 4', isCorrect: true }]
      };

      component.bankQuestions.set([q1, q2]);
      component.toggleBankQuestionSelection(101);
      component.toggleBankQuestionSelection(102);

      expect(component.selectedBankQuestionIds().size).toBe(2);

      component.importSelectedQuestions();

      expect(component.isBankModalOpen()).toBe(false);
      expect(component.questions().length).toBe(2);
      expect(component.questions()[0].content).toBe('Bulk Q1');
      expect(component.questions()[1].content).toBe('Bulk Q2');
      expect(component.activeQuestionIndex()).toBe(1);
      expect(component.activeQuestion()?.content).toBe('Bulk Q2');
    });

    it('should duplicate active question in-place with deep-copied answers and select duplicate', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.addQuestion(0);
      const initial = component.activeQuestion()!;
      initial.content = 'Original Question Statement';
      initial.answers[0].content = 'First Original Answer';

      expect(component.questions().length).toBe(1);
      expect(component.activeQuestionIndex()).toBe(0);

      component.duplicateQuestion();

      expect(component.questions().length).toBe(2);
      expect(component.activeQuestionIndex()).toBe(1);

      const duplicated = component.activeQuestion()!;
      expect(duplicated.content).toBe('Original Question Statement');
      expect(duplicated.id).not.toBe(initial.id);
      expect(duplicated.answers[0].content).toBe('First Original Answer');
      expect(duplicated.answers[0].id).not.toBe(initial.answers[0].id);

      // Verify deep copy: editing duplicate does not mutate initial
      duplicated.answers[0].content = 'Edited Duplicate Answer';
      expect(component.questions()[0].answers[0].content).toBe('First Original Answer');
    });

    it('should switch source tabs between public and my questions and reload', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      const quizService = TestBed.inject(QuizService);
      fixture.detectChanges();

      const publicSpy = vi.spyOn(quizService, 'getExploreQuestions');
      const mineSpy = vi.spyOn(quizService, 'getMyQuestions');

      expect(component.bankSourceTab()).toBe('public');

      component.setBankSourceTab('mine');
      expect(component.bankSourceTab()).toBe('mine');
      expect(mineSpy).toHaveBeenCalled();

      component.setBankSourceTab('public');
      expect(component.bankSourceTab()).toBe('public');
      expect(publicSpy).toHaveBeenCalled();
    });

    it('should retain selections across search and category filters and bulk import all selected questions', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.openBankModal();

      const qCat1: any = {
        id: 501,
        categoryId: 1,
        content: 'Question from Cat 1',
        questionType: 0,
        answers: [{ id: 1, content: 'Cat1 A', isCorrect: true }, { id: 2, content: 'Cat1 B', isCorrect: false }]
      };
      const qCat2: any = {
        id: 502,
        categoryId: 2,
        content: 'Question from Cat 2',
        questionType: 0,
        answers: [{ id: 3, content: 'Cat2 A', isCorrect: true }, { id: 4, content: 'Cat2 B', isCorrect: false }]
      };

      // User is on Category 1, views qCat1, and selects it
      component.bankQuestions.set([qCat1]);
      component.toggleBankQuestionSelection(qCat1);
      expect(component.selectedBankQuestionIds().size).toBe(1);

      // User changes filter/search to Category 2; bankQuestions now only contains qCat2
      component.bankCategoryFilter.set(2);
      component.bankQuestions.set([qCat2]);
      component.toggleBankQuestionSelection(qCat2);
      expect(component.selectedBankQuestionIds().size).toBe(2);

      // Bulk import should import BOTH questions even though bankQuestions only has qCat2
      component.importSelectedQuestions();

      expect(component.questions().length).toBe(2);
      expect(component.questions()[0].content).toBe('Question from Cat 1');
      expect(component.questions()[1].content).toBe('Question from Cat 2');
      expect(component.isBankModalOpen()).toBe(false);
    });

    it('should provide True/False fallback answers when imported T/F question has missing answers', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      const quizService = TestBed.inject(QuizService);
      fixture.detectChanges();

      vi.spyOn(quizService, 'getQuestionDetail').mockReturnValue(of({
        id: 701,
        versions: [{ isCurrent: true, answers: [] }]
      } as any));

      const tfQuestion: any = {
        id: 701,
        categoryId: 1,
        content: 'Electrons are lighter than protons.',
        questionType: 2, // TrueFalse
        answers: [] // Missing answers
      };

      component.importSingleQuestion(tfQuestion);

      expect(component.questions().length).toBe(1);
      const imported = component.questions()[0];
      expect(component.isTrueFalse(imported.questionType)).toBe(true);
      expect(imported.answers.length).toBe(2);
      expect(imported.answers[0].content).toBe('True');
      expect(imported.answers[0].isCorrect).toBe(true);
      expect(imported.answers[1].content).toBe('False');
      expect(imported.answers[1].isCorrect).toBe(false);
    });

    it('should unsubscribe active search requests when a new search or filter is triggered', () => {
      const fixture = TestBed.createComponent(EditQuizComponent);
      const component = fixture.componentInstance;
      const quizService = TestBed.inject(QuizService);
      fixture.detectChanges();

      let activeSubscribers = 0;
      vi.spyOn(quizService, 'getExploreQuestions').mockImplementation(() => {
        return {
          subscribe: (observer: any) => {
            activeSubscribers++;
            return {
              unsubscribe: () => {
                activeSubscribers--;
              }
            };
          }
        } as any;
      });

      component.openBankModal();
      expect(activeSubscribers).toBe(1);

      // Trigger second search/filter change
      component.bankSearchQuery.set('neutrino');
      component.onBankSearchOrFilterChange();

      // First subscription should have been cancelled, leaving only 1 active subscription
      expect(activeSubscribers).toBe(1);

      component.closeBankModal();
      // Closing modal should unsubscribe
      expect(activeSubscribers).toBe(0);
    });
  });
});


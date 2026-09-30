import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MyDecksComponent } from './my-decks.component';

describe('MyDecksComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyDecksComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create my decks component', () => {
    const fixture = TestBed.createComponent(MyDecksComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle deck expansion', () => {
    const fixture = TestBed.createComponent(MyDecksComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const deck = component.myQuizzes()[0];
    if (deck) {
      component.toggleExpand(deck);
      expect(component.expandedDeckId()).toBe(deck.id);

      component.toggleExpand(deck);
      expect(component.expandedDeckId()).toBeNull();
    }
  });

  it('should not filter decks by quizCode', () => {
    const fixture = TestBed.createComponent(MyDecksComponent);
    const component = fixture.componentInstance;
    component.myQuizzes.set([
      {
        id: 1,
        title: 'Quantum Physics',
        description: 'Deep dive',
        quizCode: 'QUANT1',
        categoryId: 1,
        categoryName: 'Physics',
        duration: 20,
        maxAttempts: 3,
        visibility: 1,
        questionCount: 5,
        createdAt: '',
        updatedAt: ''
      }
    ]);
    fixture.detectChanges();

    component.searchQuery.set('QUANT1');
    expect(component.filteredQuizzes().length).toBe(0);
  });

  it('should paginate decks correctly with pageSize 6 and navigate pages', () => {
    const fixture = TestBed.createComponent(MyDecksComponent);
    const component = fixture.componentInstance;

    const sampleDecks: any[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Deck ${i + 1}`,
      description: `Description ${i + 1}`,
      categoryName: 'General',
      duration: 15,
      maxAttempts: 2,
      visibility: 1,
      questionCount: 10
    }));

    component.myQuizzes.set(sampleDecks);
    fixture.detectChanges();

    expect(component.pageSize()).toBe(6);
    expect(component.totalPages()).toBe(3); // 15 / 6 = 3
    expect(component.paginatedQuizzes().length).toBe(6);
    expect(component.paginatedQuizzes()[0].id).toBe(1);

    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedQuizzes()[0].id).toBe(7);

    component.goToPage(3);
    expect(component.currentPage()).toBe(3);
    expect(component.paginatedQuizzes().length).toBe(3);

    component.prevPage();
    expect(component.currentPage()).toBe(2);
  });

  it('should filter decks by status (all, normal, disabled) and reset pagination page', () => {
    const fixture = TestBed.createComponent(MyDecksComponent);
    const component = fixture.componentInstance;

    component.myQuizzes.set([
      {
        id: 1,
        title: 'Algorithms 101',
        description: 'Basics of CS',
        categoryId: 1,
        categoryName: 'CS',
        duration: 15,
        maxAttempts: 1,
        visibility: 1,
        questionCount: 5,
        isActive: true,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 2,
        title: 'Legacy Python Quiz',
        description: 'Old curriculum',
        categoryId: 1,
        categoryName: 'CS',
        duration: 20,
        maxAttempts: 2,
        visibility: 0,
        questionCount: 8,
        isActive: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 3,
        title: 'Data Structures',
        description: 'Trees and graphs',
        categoryId: 1,
        categoryName: 'CS',
        duration: 25,
        maxAttempts: 3,
        visibility: 1,
        questionCount: 10,
        isActive: true,
        createdAt: '',
        updatedAt: ''
      }
    ]);
    fixture.detectChanges();

    expect(component.normalCount()).toBe(2);
    expect(component.disabledCount()).toBe(1);
    expect(component.filteredQuizzes().length).toBe(3);

    // Filter by normal
    component.setStatusFilter('normal');
    expect(component.filteredQuizzes().length).toBe(2);
    expect(component.filteredQuizzes().every(q => q.isActive !== false)).toBe(true);

    // Filter by disabled
    component.setStatusFilter('disabled');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].id).toBe(2);
    expect(component.filteredQuizzes()[0].isActive).toBe(false);

    // Back to all
    component.setStatusFilter('all');
    expect(component.filteredQuizzes().length).toBe(3);

    // Search combined with status filter
    component.setStatusFilter('normal');
    component.searchQuery.set('Data');
    expect(component.filteredQuizzes().length).toBe(1);
    expect(component.filteredQuizzes()[0].title).toBe('Data Structures');

    // Reset filters
    component.setStatusFilter('all');
    component.searchQuery.set('');
    expect(component.filteredQuizzes().length).toBe(3);
  });
});


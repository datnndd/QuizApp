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
});

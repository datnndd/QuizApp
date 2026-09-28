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

  it('should add question and options', () => {
    const fixture = TestBed.createComponent(EditQuizComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const initialCount = component.questions().length;
    component.addQuestion();
    expect(component.questions().length).toBe(initialCount + 1);
  });
});

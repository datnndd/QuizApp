import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the landing component', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle options and update feedback correctly', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    expect(component['selectedOption']()).toBe('A');

    component.selectOption('B');
    expect(component['selectedOption']()).toBe('B');
    expect(component['currentFeedback']().badge).toBe('FACT CHECK');
  });

  it('should open and close preview modal', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    expect(component['previewModalOpen']()).toBe(false);

    component.openPreview(component['decks'][0]);
    expect(component['previewModalOpen']()).toBe(true);
    expect(component['previewDeck']()?.title).toBe('World Capitals Challenge');

    component.closePreview();
    expect(component['previewModalOpen']()).toBe(false);
  });
});

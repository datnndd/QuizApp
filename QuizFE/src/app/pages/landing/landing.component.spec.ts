import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([
          { path: '', component: LandingComponent },
          { path: 'login', component: LandingComponent },
          { path: 'register', component: LandingComponent }
        ]),
        provideHttpClient()
      ]
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
    expect(component['currentFeedback']().speech).toContain('95');
  });

  it('should open and close preview modal', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    expect(component['previewModalOpen']()).toBe(false);

    component.openPreview(component['decks'][0]);
    expect(component['previewModalOpen']()).toBe(true);
    expect(component['previewDeck']()?.title).toBe('Solar System & Deep Space');

    component.closePreview();
    expect(component['previewModalOpen']()).toBe(false);
  });

  it('should open login, register, and close auth modal', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    expect(component.authModal()).toBeNull();

    component.openLogin();
    expect(component.authModal()).toBe('login');

    component.openRegister();
    expect(component.authModal()).toBe('register');

    component.closeAuthModal();
    expect(component.authModal()).toBeNull();
  });

  it('should close auth modal on escape key press', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    component.openLogin();
    expect(component.authModal()).toBe('login');

    component.onEscapeKey();
    expect(component.authModal()).toBeNull();
  });
});

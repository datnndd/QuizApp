import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface QuizExplanation {
  correct: boolean;
  title: string;
  badge: string;
  icon: string;
  text: string;
  streak: string;
  xp: string;
}

interface Deck {
  title: string;
  category: string;
  description: string;
  rating: string;
  questionsCount: number;
  duration: string;
  imageUrl: string;
  sampleQuestions: string[];
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  protected readonly selectedOption = signal<string>('A');
  protected readonly timerDisplay = signal<string>('00:42');
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private secondsLeft = 42;

  protected readonly previewModalOpen = signal<boolean>(false);
  protected readonly previewDeck = signal<Deck | null>(null);

  protected readonly explanations: Record<string, QuizExplanation> = {
    A: {
      correct: true,
      title: 'Verified Explanation',
      badge: 'VERIFIED',
      icon: 'check',
      text: "Saturn holds the official record with 146 discovered moons, outnumbering Jupiter's 95 officially confirmed satellites.",
      streak: '3-Day Streak Active',
      xp: '+150 XP Earned'
    },
    B: {
      correct: false,
      title: 'Close, but not quite',
      badge: 'FACT CHECK',
      icon: 'info',
      text: "Jupiter held the title previously with 95 moons, but telescope discoveries placed Saturn ahead at 146.",
      streak: 'Streak Protected',
      xp: '+50 XP for Effort'
    },
    C: {
      correct: false,
      title: 'Not Neptune',
      badge: 'FACT CHECK',
      icon: 'help',
      text: 'Neptune only has 16 recognized moons. Saturn leads the solar system with 146 confirmed moons.',
      streak: 'Streak Active',
      xp: '+50 XP for Effort'
    },
    D: {
      correct: false,
      title: 'Not Mars',
      badge: 'FACT CHECK',
      icon: 'help',
      text: 'Mars only has 2 tiny moons: Phobos and Deimos. Saturn leads the planetary pack with 146.',
      streak: 'Streak Active',
      xp: '+50 XP for Effort'
    }
  };

  protected readonly currentFeedback = computed(() => {
    return this.explanations[this.selectedOption()] || this.explanations['A'];
  });

  protected readonly decks: Deck[] = [
    {
      title: 'World Capitals Challenge',
      category: 'Geography',
      description: 'Test your recognition of international capitals, territorial landmarks, and regional topography.',
      rating: '4.9',
      questionsCount: 10,
      duration: '5 Minutes',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAhJUNyOhp8khFzJiMBb0VI-j6S8ekcmoAc3CdEEw5b0VAPYh0Vyi8ixP73VGAyoLX7CvffzD0e2kCuHA_4AhGhRFl74CejpwtvAE627lG06kMHu6p0_3178N9yyjqnDholNJfqEnMrW0ePTdU1r9Suwn2OCANzoFtnASF4mhJkuc4MmNZ5MNgPNqDz6uaxNtFWd5uV_Z5AHpJkRPlBT3n-dJjWzTncvn227RcUEmLQwAY2cP1UkV-',
      sampleQuestions: [
        'What is the capital city of Australia?',
        'Which city is known as the capital of two countries?',
        'Which European capital lies on the Danube River?'
      ]
    },
    {
      title: 'Web Dev Fundamentals',
      category: 'Computer Architecture',
      description: 'Clarify core concepts in semantic DOM layout, modern responsive CSS architecture, and ES6 runtime logic.',
      rating: '5.0',
      questionsCount: 12,
      duration: '6 Minutes',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrG6QKUJWBm-6AYDznh-x5uZ2C2sOzt3Mg4UNoDvswXTaJlzywXoJzl7AfiVGvDJ0cszn7qL1o-dNjkYk3Kjla1iPUGpXu1jGX6STouJI-CbRTmP7c2Zv7P0lbwz78GCErvR5pkwKz89NvaPHrwNUJoQj-A8T1DFuuwqTxowD5O-GrFTXbPnR0D6lKD78HM3dsixO99YXtZNqvIXWRmfaHjuG-nrx4h-IlssXf6gUeng3XbEomV5q7',
      sampleQuestions: [
        'How does the CSS box-sizing: border-box property operate?',
        'What distinguishes const from let in block execution?',
        'What is the semantic purpose of the <main> element?'
      ]
    },
    {
      title: 'Solar System & Deep Space',
      category: 'Astrophysics',
      description: 'Review planetary orbits, exoplanets, recent space telescope observations, and deep space milestones.',
      rating: '4.9',
      questionsCount: 10,
      duration: '5 Minutes',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TTLcCkeUwVfWXTrIxHehhUpdHEOEBlgi-ZqpqBL6Y66cI49uTE1qkBGX7EIvMBD75MVuBFsOxIiZhFn7VYPWa6tkvjta5K7Z5wIqFy7KrNTKCRcq4JqocqWto_YaQsakcN6gS5OnlVOHQDuchWO_pnCSCoPiqZ9ruV83O_LetQT5XFqsmgWSSE6H-dUFNbStb_0O5-L43qNyG1YlkndLTm383G2yhNMolHUxPkRgo74CUmMwVUZo',
      sampleQuestions: [
        'Which planet possesses the most confirmed natural satellites?',
        'What causes the magnetic field of Jupiter?',
        'What is the event horizon of a supermassive black hole?'
      ]
    }
  ];

  ngOnInit(): void {
    this.timerInterval = setInterval(() => {
      if (this.secondsLeft > 0) {
        this.secondsLeft--;
      } else {
        this.secondsLeft = 60;
      }
      const formatted = `00:${this.secondsLeft < 10 ? '0' : ''}${this.secondsLeft}`;
      this.timerDisplay.set(formatted);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  selectOption(option: string): void {
    this.selectedOption.set(option);
  }

  openPreview(deck: Deck): void {
    this.previewDeck.set(deck);
    this.previewModalOpen.set(true);
  }

  closePreview(): void {
    this.previewModalOpen.set(false);
    this.previewDeck.set(null);
  }
}

import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface QuizOptionFeedback {
  speech: string;
  title: string;
  desc: string;
  icon: string;
  correct: boolean;
  xp?: string;
  badge: string;
}

export interface StarterDeck {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  questionsCount?: number;
  duration?: string;
  rating?: string;
  sampleQuestions?: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  // Interactive Hero Quiz State
  protected readonly selectedOption = signal<'A' | 'B' | 'C'>('A');

  // Preview Modal State
  protected readonly previewModalOpen = signal<boolean>(false);
  protected readonly previewDeck = signal<StarterDeck | null>(null);

  protected readonly optionData: Record<'A' | 'B' | 'C', QuizOptionFeedback> = {
    A: {
      speech: 'Spot on! Saturn has 146! 🪐',
      title: 'Spot on! 🎉',
      desc: "Saturn holds the official record with 146 discovered moons, outnumbering Jupiter's 95 officially confirmed satellites.",
      icon: 'verified',
      correct: true,
      xp: '+150 XP Earned',
      badge: 'VERIFIED'
    },
    B: {
      speech: 'Close! Jupiter has 95 🔭',
      title: 'Close, but not quite',
      desc: "Jupiter held the title previously with 95 moons, but telescope discoveries placed Saturn ahead at 146.",
      icon: 'info',
      correct: false,
      xp: '+50 XP for trying',
      badge: 'FACT CHECK'
    },
    C: {
      speech: 'Neptune only has 16 🌊',
      title: 'Not Neptune',
      desc: 'Neptune only has 16 recognized moons. Saturn leads the solar system with 146 confirmed moons.',
      icon: 'help',
      correct: false,
      xp: '+50 XP for trying',
      badge: 'FACT CHECK'
    }
  };

  protected readonly currentFeedback = computed(() => {
    return this.optionData[this.selectedOption()] || this.optionData['A'];
  });

  // 3 Popular Starter Decks (from Stitch Screen 7)
  protected readonly decks: StarterDeck[] = [
    {
      id: 'space-1',
      title: 'Solar System & Deep Space',
      category: 'Astrophysics',
      description: 'Planetary moons, event horizons, and recent orbital discoveries.',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDJoi27RHdqwtc1-XPkAuUefms0pNM_5rW3kfvkYWi6r9tNExYFv7rr0S3xyujoBBNGRfzNvI5scU1lhterG3u0HMKJA9l7UmzDWb5423DckAxIzm2iYlwOwynTLRaTT_iAubJv16MgIXFnlIhEBbzGS_43BMJv7hObFvwY3KL79aCBy2DfYTQb-qRftTj0STTx-UTnjVGXWDNMPwSAiO_ioRKURJ_hDaQJlTzH-JW4O5iuiboK_pAI',
      questionsCount: 15,
      duration: '12 Mins',
      rating: '4.9',
      sampleQuestions: [
        'Which planet in our solar system has the greatest number of confirmed moons?',
        'What is the event horizon of a supermassive black hole?',
        'What causes Jupiter’s intense auroras?'
      ]
    },
    {
      id: 'webdev-1',
      title: 'Web Dev Fundamentals',
      category: 'Architecture',
      description: 'CSS box model, ES6 runtimes, DOM hierarchy, and state lifecycles.',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDfwnnhxwcLo3DChsv9Ttmc7w0nYQua0D_M616Ct3n3QeLv1lj1onZS5fORCp-Xfhjc7d4GleV3nBFknlZ6HS3A6jCmzpz4SJBEXA30Ofkq2LD7HPaeSM7k-8MWPQs7DvcomWSTZeeGLWTOHxbH291BdgxI1FRUIkEKfVNwAr7FFq9dLvmdeg9JFFnCGZ97fZh2L_qONHDPvQ98_sKBqcZuSXxysjc4-mbB-976JlOTxv_DNROw1uLc',
      questionsCount: 20,
      duration: '15 Mins',
      rating: '4.8',
      sampleQuestions: [
        'How does CSS box-sizing: border-box operate?',
        'What is the difference between microtasks and macrotasks in the event loop?',
        'How do signals track reactive dependencies in modern frontend frameworks?'
      ]
    },
    {
      id: 'geography-1',
      title: 'World Capitals Challenge',
      category: 'Geography',
      description: 'National landmarks, river capitals, and disputed border markers.',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD2aArskNfW5lsBLD7IVMxZfIHu39-S1g3Rl53sD18GMB1vmjWBBkgVRgVRmhHz2DKiePnHvZeCif-8iUup8fSNIS941--X5BB-TZ0PQaGzijAnp3Tp2lhJhXsoZ33Oa7-9mXnLwIj4QZFMvFl65x3pp7e-uls4B1_YRcaTO5MvT3JsiUEdnUL7AYQSPzOwKLMiZUtkROU8nzEgyUEcy2LY7lgfhH6B95Fl8db1WsSFSLoM8yii9Lzv',
      questionsCount: 10,
      duration: '8 Mins',
      rating: '5.0',
      sampleQuestions: [
        'What is the capital city of Australia?',
        'Which city serves as the legislative capital of South Africa?',
        'Which European capital lies on the Danube River?'
      ]
    }
  ];

  selectOption(option: 'A' | 'B' | 'C'): void {
    this.selectedOption.set(option);
  }

  openPreview(deck: StarterDeck): void {
    this.previewDeck.set(deck);
    this.previewModalOpen.set(true);
  }

  closePreview(): void {
    this.previewModalOpen.set(false);
    this.previewDeck.set(null);
  }
}

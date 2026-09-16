import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface DeckQueue {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  description: string;
  badgeText: string;
  badgeType: 'review' | 'new' | 'decay';
  progressLabel: string;
  progressLabelIcon: string;
  progressCount: string;
  progressPercent: number;
  progressGradient: string;
  targetInfo: string;
  targetIcon: string;
  subInfo: string;
  estimatedTime: string;
  actionText: string;
  actionIcon: string;
  actionStyle: 'indigo' | 'gradient';
  priorityOrder: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  protected readonly userName = signal<string>('Alex Morgan');
  protected readonly userTitle = signal<string>('Level 14 Scholar');
  protected readonly userInitials = signal<string>('AM');
  protected readonly currentStreak = signal<number>(5);
  protected readonly longestStreak = signal<number>(14);
  protected readonly streakFreezesAvailable = signal<number>(1);
  protected readonly sprintProgressPercent = signal<number>(67);
  protected readonly sprintIntervalsText = signal<string>('2 of 3 daily intervals locked in');

  protected readonly activeFilter = signal<'all' | 'review' | 'new'>('all');
  protected readonly prioritySorted = signal<boolean>(false);
  protected readonly sprintActive = signal<boolean>(false);

  protected readonly decks = signal<DeckQueue[]>([
    {
      id: 'geography-1',
      title: 'World Capitals & Geopolitical Borders',
      category: 'Geography',
      categoryIcon: 'public',
      description: 'Territorial capitals, border corridors, and international sovereignty markers.',
      badgeText: '8/10 Retained',
      badgeType: 'review',
      progressLabel: 'Recall Progress',
      progressLabelIcon: 'done_all',
      progressCount: '8 / 10 cards',
      progressPercent: 80,
      progressGradient: 'from-indigo-main to-honey-gold',
      targetInfo: '+40 XP target',
      targetIcon: 'verified',
      subInfo: 'Stage 4 Spaced',
      estimatedTime: '~4 mins',
      actionText: 'Resume Spaced Sprint',
      actionIcon: 'play_arrow',
      actionStyle: 'indigo',
      priorityOrder: 2
    },
    {
      id: 'frontend-1',
      title: 'Modern Web Architecture & CSS',
      category: 'Frontend',
      categoryIcon: 'terminal',
      description: 'CSS box model architecture, semantic tags, and async JS event loops.',
      badgeText: '12 Due Today',
      badgeType: 'new',
      progressLabel: 'Deck Queue',
      progressLabelIcon: 'auto_awesome',
      progressCount: '12 Fresh Cards',
      progressPercent: 25,
      progressGradient: 'from-emerald-500 to-indigo-main',
      targetInfo: 'Study Syllabus #2',
      targetIcon: 'school',
      subInfo: '0 / 12 initiated',
      estimatedTime: '~5 mins',
      actionText: 'Start Deck',
      actionIcon: 'arrow_forward',
      actionStyle: 'indigo',
      priorityOrder: 3
    },
    {
      id: 'astrophysics-1',
      title: 'Solar System Mechanics & Deep Space',
      category: 'Astrophysics',
      categoryIcon: 'rocket_launch',
      description: 'Spaced decay trigger: planetary moon telemetry, gravitational lenses, spectroscopy.',
      badgeText: 'Decay Warning: -40%',
      badgeType: 'decay',
      progressLabel: 'Memory Decay Alert',
      progressLabelIcon: 'warning',
      progressCount: '-40% Ret.',
      progressPercent: 45,
      progressGradient: 'from-honey-gold via-honey-warm to-tangerine',
      targetInfo: 'Needs reinforcement',
      targetIcon: 'alarm',
      subInfo: 'Due today',
      estimatedTime: '~4 mins',
      actionText: 'Review Decaying Cards',
      actionIcon: 'history_edu',
      actionStyle: 'gradient',
      priorityOrder: 1
    }
  ]);

  protected readonly filteredDecks = computed(() => {
    const filter = this.activeFilter();
    let result = this.decks().filter((deck) => {
      if (filter === 'all') return true;
      if (filter === 'review') return deck.badgeType === 'review' || deck.badgeType === 'decay';
      if (filter === 'new') return deck.badgeType === 'new';
      return true;
    });

    if (this.prioritySorted()) {
      result = [...result].sort((a, b) => a.priorityOrder - b.priorityOrder);
    }
    return result;
  });

  protected readonly reviewCount = computed(() =>
    this.decks().filter((d) => d.badgeType === 'review' || d.badgeType === 'decay').length
  );

  protected readonly newCount = computed(() =>
    this.decks().filter((d) => d.badgeType === 'new').length
  );

  setFilter(filter: 'all' | 'review' | 'new'): void {
    this.activeFilter.set(filter);
  }

  togglePriority(): void {
    this.prioritySorted.update((v) => !v);
  }

  startSprint(): void {
    this.sprintActive.set(true);
  }
}

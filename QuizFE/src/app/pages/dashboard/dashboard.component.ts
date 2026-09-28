import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface RecentQuizAttempt {
  id: string;
  title: string;
  subject: string;
  icon: string;
  timeAgo: string;
  status: 'Completed' | 'In Progress';
  scoreFormatted: string;
  scorePercent: number;
  badgeClass: string;
}

export interface PopularQuizCard {
  id: string;
  title: string;
  category: string;
  rating: string;
  questionsCount: number;
  durationMinutes: number;
  imageUrl: string;
  badgeText: string;
  badgeIcon?: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly isAdmin = this.authService.isAdmin;
  readonly showUnauthorizedAlert = signal<boolean>(
    this.route.snapshot.queryParamMap.get('unauthorized') === 'true'
  );

  protected readonly currentUser = this.authService.currentUser;
  protected readonly userName = computed(() => this.currentUser()?.displayName || 'Alex');
  protected readonly userEmail = computed(() => this.currentUser()?.email || 'alex@university.edu');
  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user && user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.slice(0, 2).toUpperCase();
    }
    return 'AM';
  });

  protected readonly weeklyCompletedCount = signal<number>(3);
  protected readonly activeTab = signal<'dashboard' | 'recent' | 'explore' | 'deck'>('dashboard');

  // Selected Quiz Details Modal
  protected readonly selectedQuiz = signal<PopularQuizCard | RecentQuizAttempt | null>(null);
  protected readonly isModalOpen = signal<boolean>(false);

  // Recently Attempted Quizzes (Table Ledger from Stitch Screen 8)
  protected readonly recentAttempts = signal<RecentQuizAttempt[]>([
    {
      id: 'recent-1',
      title: 'Solar System & Planetary Physics',
      subject: 'Astrophysics',
      icon: 'public',
      timeAgo: 'Completed 2 hrs ago',
      status: 'Completed',
      scoreFormatted: '9/10',
      scorePercent: 90,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'recent-2',
      title: 'Web Development & Modern JS',
      subject: 'Architecture',
      icon: 'code',
      timeAgo: 'Completed yesterday',
      status: 'Completed',
      scoreFormatted: '8/10',
      scorePercent: 80,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'recent-3',
      title: 'World Capitals & Geopolitics',
      subject: 'Geography',
      icon: 'explore',
      timeAgo: 'Completed 3 days ago',
      status: 'Completed',
      scoreFormatted: '7/10',
      scorePercent: 70,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  ]);

  // Popular Quizzes (Trending Shelf from Stitch Screen 8)
  protected readonly popularQuizzes = signal<PopularQuizCard[]>([
    {
      id: 'popular-1',
      title: 'Solar System & Planetary Orbits',
      category: 'Astrophysics',
      rating: '4.9',
      questionsCount: 15,
      durationMinutes: 12,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AEtjO1WZBSTnzdQmFd6OMXUxRI_rRnoR39hO0K9hAibC_mpVnQm72svlvwPQ81aIEOq4El6PjVM-UgBPxG-Rj28SoTQz2olTFz0HgP0BlEYLEJ-zUthT7LGNThnbW-OMmuPGqGOsQK1mojmV5O_P4Rh937Om_jpKINixdsNdSj2Jt-zh00RyrbkZEuOyBYQQSOrQlvGOrUOc--ayXEDhyg7D7R6ilC8GfsZVPkruNLaoJcjASwWEQrXG_hmtoJY',
      badgeText: '🔥 Trending',
      description: 'Master orbital mechanics, planetary atmospheres, and deep galaxy horizons.'
    },
    {
      id: 'popular-2',
      title: 'Fullstack Architecture & Runtimes',
      category: 'Computer Science',
      rating: '4.8',
      questionsCount: 20,
      durationMinutes: 15,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AEtjO1W1KrQy4OsJQ9eZtcwFFpq3qVMXX-kBU5RDV1WaPBRIrY9TL_ac2Iu5BVTPGKvyGyOuWx4dG9wZY7tDJiwfstebRDH2PW8OjX4L-fsxrlRW1Erf0VtVlrTDilKGaciKen960C0GBXHJlM-QkmHwv9akltzBhCN4R193xYNmY0JOe6af_r-yAaNWF00PkPFyGkNGl3fss7O9-QVaSiatEHAjsh4j5OQfp4jra-rpkQIT1BNFEp4Fbsi-PjE',
      badgeText: '⭐ Popular',
      description: 'Test your knowledge on asynchronous event loops, closures, and server layouts.'
    },
    {
      id: 'popular-3',
      title: 'Global Cartography & Microstates',
      category: 'Geography',
      rating: '5.0',
      questionsCount: 10,
      durationMinutes: 8,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AEtjO1XNwrMciMewErDnjf1mvyxdH4KMQtGuqJG2dXVSC7y0vfUMMg0nI5fzWEdv6zQr7HxJgmWNOi7sq1O-XWnsG-GuZY_bLOOlL6rdCGarVjpiiT8RpjHUOfT-LURjr5pqBcfRuPddSRpub3E-EBaZJiljX4wVKHGbDPnfLSB-nf22pfmJ2j-EJ0LXfQyjQpuoF9I_-e4_1kxwXQqZdBQnLIt8UFAD6Hmg3pTQ9tTUIRww_2zNGO-7uuTu3w',
      badgeText: '✨ New',
      description: 'Identify sovereign borders, historic navigation routes, and hidden territories.'
    }
  ]);

  setActiveTab(tab: 'dashboard' | 'recent' | 'explore' | 'deck'): void {
    this.activeTab.set(tab);
  }

  openQuizModal(quiz: PopularQuizCard | RecentQuizAttempt): void {
    this.selectedQuiz.set(quiz);
    this.isModalOpen.set(true);
  }

  closeQuizModal(): void {
    this.isModalOpen.set(false);
    this.selectedQuiz.set(null);
  }

  logout(): void {
    this.authService.logout();
  }

  dismissUnauthorizedAlert(): void {
    this.showUnauthorizedAlert.set(false);
  }
}

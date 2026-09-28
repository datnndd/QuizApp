import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-header.component.html',
  styleUrl: './player-header.component.css'
})
export class PlayerHeaderComponent {
  readonly quizTitle = input<string>('Quiz Session');
  readonly currentQuestionIndex = input<number>(0);
  readonly totalQuestions = input<number>(0);
  readonly timeRemainingFormatted = input<string>('--:--');
  readonly isTimeWarning = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);

  readonly leave = output<void>();
  readonly submit = output<void>();

  readonly showLeaveConfirm = signal<boolean>(false);
  readonly showSubmitConfirm = signal<boolean>(false);

  openLeaveModal(): void {
    this.showLeaveConfirm.set(true);
  }

  cancelLeave(): void {
    this.showLeaveConfirm.set(false);
  }

  confirmLeave(): void {
    this.showLeaveConfirm.set(false);
    this.leave.emit();
  }

  openSubmitModal(): void {
    this.showSubmitConfirm.set(true);
  }

  cancelSubmit(): void {
    this.showSubmitConfirm.set(false);
  }

  confirmSubmit(): void {
    this.showSubmitConfirm.set(false);
    this.submit.emit();
  }
}

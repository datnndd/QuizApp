import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerHeaderComponent } from '../../shared/components/player-header/player-header.component';
import { QuizService } from '../../core/services/quiz.service';
import {
  AttemptDetail,
  AttemptQuestion,
  AttemptResult,
  calculateAccuracy,
  getQuestionTypeDisplay,
  isMultipleChoice,
  isSingleChoice,
  isTrueFalse,
  QuizDetail
} from '../../core/models/quiz.models';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [CommonModule, PlayerHeaderComponent],
  templateUrl: './quiz-player.component.html',
  styleUrl: './quiz-player.component.css'
})
export class QuizPlayerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quizService = inject(QuizService);

  readonly attempt = signal<AttemptDetail | null>(null);
  protected readonly Math = Math;
  readonly currentQuestionIndex = signal<number>(0);
  readonly flaggedQuestionIndices = signal<Set<number>>(new Set());
  readonly selectedAnswersMap = signal<Record<number, number[]>>({}); // questionId -> answerIds[]
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly resultModalOpen = signal<boolean>(false);
  readonly attemptResult = signal<AttemptResult | null>(null);

  // Timer state
  readonly secondsRemaining = signal<number>(15 * 60);
  private timerInterval: any = null;

  readonly currentQuestion = computed<AttemptQuestion | null>(() => {
    const att = this.attempt();
    if (!att || att.questions.length === 0) return null;
    return att.questions[this.currentQuestionIndex()] || null;
  });

  readonly totalQuestions = computed<number>(() => this.attempt()?.questions.length || 0);

  readonly timeRemainingFormatted = computed<string>(() => {
    const total = this.secondsRemaining();
    if (total <= 0) return '00:00';
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  readonly isTimeWarning = computed<boolean>(() => this.secondsRemaining() <= 120);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const quizId = idParam ? parseInt(idParam, 10) : 1;
    this.startOrResumeAttempt(quizId);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startOrResumeAttempt(quizId: number): void {
    this.isLoading.set(true);
    this.quizService.getQuizById(quizId).subscribe({
      next: (quiz) => {
        // Try resuming existing in-progress attempt first
        this.quizService.resumeAttempt(quiz.quizCode).subscribe({
          next: (existingAtt) => {
            this.handleAttemptLoaded(existingAtt, quiz);
          },
          error: () => {
            // No in-progress attempt to resume, start new attempt
            this.quizService.startAttempt({ quizCode: quiz.quizCode }).subscribe({
              next: (newAtt) => {
                this.handleAttemptLoaded(newAtt, quiz);
              },
              error: () => {
                this.fallbackFromQuiz(quiz);
              }
            });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private handleAttemptLoaded(att: AttemptDetail, quiz: QuizDetail): void {
    if ((!att.questions || att.questions.length === 0 || att.quizId !== quiz.id) && quiz.questions && quiz.questions.length > 0) {
      att.questions = quiz.questions.map((q, idx) => ({
        attemptQuestionId: q.questionId || idx + 1,
        questionId: q.questionId || idx + 1,
        questionVersionId: q.questionVersionId || idx + 1,
        order: q.order || idx + 1,
        content: q.content,
        questionType: q.questionType,
        answers: (q.answers || []).map(a => ({ id: a.id, content: a.content })),
        selectedAnswerIds: []
      }));
    } else if (att.questions && att.questions.length > 0 && quiz.questions && quiz.questions.length > 0) {
      att.questions.forEach(aq => {
        if (!aq.answers || aq.answers.length === 0) {
          const matchQ = quiz.questions.find(qq => qq.questionId === aq.questionId || qq.order === aq.order);
          if (matchQ && matchQ.answers && matchQ.answers.length > 0) {
            aq.answers = matchQ.answers.map(a => ({ id: a.id, content: a.content }));
          }
        }
      });
    }
    this.setupAttempt(att, quiz.duration);
  }

  private fallbackFromQuiz(quiz: QuizDetail): void {
    const fallbackAtt: AttemptDetail = {
      id: Date.now(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      status: 'InProgress',
      startedAt: new Date().toISOString(),
      expiresAt: quiz.duration ? new Date(Date.now() + quiz.duration * 60000).toISOString() : undefined,
      isAutoSubmitted: false,
      questions: (quiz.questions || []).map((q, idx) => ({
        attemptQuestionId: q.questionId || idx + 1,
        questionId: q.questionId || idx + 1,
        questionVersionId: q.questionVersionId || idx + 1,
        order: q.order || idx + 1,
        content: q.content,
        questionType: q.questionType,
        answers: (q.answers || []).map(a => ({ id: a.id, content: a.content, isCorrect: a.isCorrect })),
        selectedAnswerIds: []
      }))
    };
    this.setupAttempt(fallbackAtt, quiz.duration);
  }

  private setupAttempt(att: AttemptDetail, durationMinutes: number): void {
    this.attempt.set(att);
    const map: Record<number, number[]> = {};
    (att.questions || []).forEach(q => {
      map[q.questionId] = [...(q.selectedAnswerIds || [])];
    });
    this.selectedAnswersMap.set(map);

    // Setup timer
    const durationSecs = (durationMinutes > 0 ? durationMinutes : 15) * 60;
    this.secondsRemaining.set(durationSecs);
    this.startTimer();
    this.isLoading.set(false);
  }

  private startTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const rem = this.secondsRemaining() - 1;
      if (rem <= 0) {
        this.secondsRemaining.set(0);
        clearInterval(this.timerInterval);
        this.submitAttempt(); // auto submit on expiry
      } else {
        this.secondsRemaining.set(rem);
      }
    }, 1000);
  }

  selectQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions()) {
      this.currentQuestionIndex.set(index);
    }
  }

  previousQuestion(): void {
    const cur = this.currentQuestionIndex();
    if (cur > 0) this.currentQuestionIndex.set(cur - 1);
  }

  nextQuestion(): void {
    const cur = this.currentQuestionIndex();
    if (cur < this.totalQuestions() - 1) this.currentQuestionIndex.set(cur + 1);
  }

  toggleFlagCurrentQuestion(): void {
    const cur = this.currentQuestionIndex();
    this.flaggedQuestionIndices.update(set => {
      const next = new Set(set);
      if (next.has(cur)) next.delete(cur);
      else next.add(cur);
      return next;
    });
  }

  isQuestionFlagged(index: number): boolean {
    return this.flaggedQuestionIndices().has(index);
  }

  isQuestionAnswered(index: number): boolean {
    const q = this.attempt()?.questions[index];
    if (!q) return false;
    const selected = this.selectedAnswersMap()[q.questionId] || [];
    return selected.length > 0;
  }

  isAnswerSelected(answerId: number): boolean {
    const q = this.currentQuestion();
    if (!q) return false;
    const list = this.selectedAnswersMap()[q.questionId] || [];
    return list.includes(answerId);
  }

  toggleAnswer(answerId: number): void {
    const q = this.currentQuestion();
    if (!q) return;

    let updated: number[];
    const current = this.selectedAnswersMap()[q.questionId] || [];

    if (isSingleChoice(q.questionType) || isTrueFalse(q.questionType)) {
      // Single choice and True/False questions only permit one selected option
      updated = [answerId];
    } else {
      // Multiple choice
      if (current.includes(answerId)) {
        updated = current.filter(id => id !== answerId);
      } else {
        updated = [...current, answerId];
      }
    }

    this.selectedAnswersMap.update(map => ({
      ...map,
      [q.questionId]: updated
    }));

    // Live background autosave
    const att = this.attempt();
    if (att) {
      this.quizService.saveAnswer(att.id, q.attemptQuestionId, updated).subscribe();
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isSingleChoice(type?: any): boolean {
    return isSingleChoice(type);
  }

  isMultipleChoice(type?: any): boolean {
    return isMultipleChoice(type);
  }

  isTrueFalse(type?: any): boolean {
    return isTrueFalse(type);
  }

  getQuestionTypeLabel(type?: any): string {
    return getQuestionTypeDisplay(type);
  }

  getAccuracy(res: AttemptResult | null): number {
    return res ? calculateAccuracy(res.correctAnswers, res.totalQuestions, res.score) : 0;
  }

  isPassed(res: AttemptResult | null): boolean {
    return this.getAccuracy(res) >= 70;
  }

  onLeave(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.router.navigate(['/dashboard']);
  }

  submitAttempt(): void {
    const att = this.attempt();
    if (!att || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.quizService.submitAttempt(att.id).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.attemptResult.set(res);
        this.resultModalOpen.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.gradeLocallyAndShowResult(att);
      }
    });
  }

  private gradeLocallyAndShowResult(att: AttemptDetail): void {
    const questions = att.questions || [];
    let correctCount = 0;
    const selectedMap = this.selectedAnswersMap();

    const questionResults = questions.map(q => {
      const selected = selectedMap[q.questionId] || [];
      const answers = (q as any).answers || [];
      const correctAnswers = answers.filter((a: any) => a.isCorrect).map((a: any) => a.id);
      let isCorrect = false;
      if (correctAnswers.length > 0) {
        isCorrect = correctAnswers.length === selected.length &&
          correctAnswers.every((id: number) => selected.includes(id));
      } else {
        isCorrect = selected.length > 0;
      }
      if (isCorrect) correctCount++;

      return {
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        order: q.order,
        content: q.content,
        isCorrect,
        answers: answers.map((a: any) => ({
          id: a.id,
          content: a.content,
          isCorrect: !!a.isCorrect,
          isSelected: selected.includes(a.id)
        }))
      };
    });

    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const result: AttemptResult = {
      attemptId: att.id,
      score: accuracy,
      totalQuestions: total,
      correctAnswers: correctCount,
      incorrectAnswers: total - correctCount,
      timeSpentSeconds: Math.max(1, (15 * 60) - this.secondsRemaining()),
      isAutoSubmitted: false,
      questions: questionResults
    };

    this.attemptResult.set(result);
    this.resultModalOpen.set(true);
  }

  goToRecentQuizzes(): void {
    this.resultModalOpen.set(false);
    this.router.navigate(['/recent-quizzes']);
  }

  goToDashboard(): void {
    this.resultModalOpen.set(false);
    this.router.navigate(['/dashboard']);
  }
}

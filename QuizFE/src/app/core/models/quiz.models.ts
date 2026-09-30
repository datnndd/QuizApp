export type QuizVisibility = 0 | 1 | 'Private' | 'Public'; // 0 = Private, 1 = Public
export type QuizAttemptStatus = 0 | 1 | 'InProgress' | 'Submitted'; // 0 = InProgress, 1 = Submitted
export type QuestionType = 0 | 1 | 2 | 'SingleChoice' | 'MultipleChoice' | 'TrueFalse'; // 0 = SingleChoice, 1 = MultipleChoice, 2 = TrueFalse

export function isAttemptCompleted(status?: QuizAttemptStatus | string | number | null, submittedAt?: string | null): boolean {
  if (submittedAt && typeof submittedAt === 'string' && submittedAt.trim().length > 0) return true;
  if (status === 1 || status === '1') return true;
  if (typeof status === 'string') {
    const s = status.trim().toLowerCase();
    return s === 'submitted' || s === 'completed';
  }
  return false;
}

export function isAttemptInProgress(status?: QuizAttemptStatus | string | number | null, submittedAt?: string | null): boolean {
  if (isAttemptCompleted(status, submittedAt)) return false;
  if (status === 0 || status === '0') return true;
  if (typeof status === 'string') {
    const s = status.trim().toLowerCase();
    return s === 'inprogress' || s === 'in_progress' || s === 'in progress';
  }
  return false;
}

export function isSingleChoice(type?: QuestionType | string | number | null): boolean {
  if (type === undefined || type === null || type === 0 || type === '0') return true;
  if (typeof type === 'string') {
    const s = type.trim().toLowerCase();
    return s === 'singlechoice' || s === 'single_choice' || s === 'single choice' || s === 'single';
  }
  return false;
}

export function isMultipleChoice(type?: QuestionType | string | number | null): boolean {
  if (type === 1 || type === '1') return true;
  if (typeof type === 'string') {
    const s = type.trim().toLowerCase();
    return s === 'multiplechoice' || s === 'multiple_choice' || s === 'multiple choice' || s === 'multiple';
  }
  return false;
}

export function isTrueFalse(type?: QuestionType | string | number | null): boolean {
  if (type === 2 || type === '2') return true;
  if (typeof type === 'string') {
    const s = type.trim().toLowerCase();
    return s === 'truefalse' || s === 'true_false' || s === 'true/false' || s === 'true false' || s === 'boolean';
  }
  return false;
}

export function getQuestionTypeDisplay(type?: QuestionType | string | number | null): string {
  if (isTrueFalse(type)) return 'True / False';
  if (isMultipleChoice(type)) return 'Multiple Choice';
  return 'Single Choice';
}

export function calculateAccuracy(correct?: number | null, total?: number | null, rawScore?: number | null): number {
  if (total && total > 0) {
    if (correct !== undefined && correct !== null) {
      return Math.round((correct / total) * 100);
    }
    if (rawScore !== undefined && rawScore !== null && rawScore <= total) {
      return Math.round((rawScore / total) * 100);
    }
  }
  return Math.round(rawScore || 0);
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface QuizSummary {
  id: number;
  title: string;
  description: string;
  quizCode?: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  categoryName: string;
  ownerId?: number;
  ownerName?: string;
  ownerDisplayName?: string;
  questionCount: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttemptResultItem {
  attemptId: number;
  userId: number;
  studentName: string;
  studentEmail: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  submittedAt?: string;
  status: string;
}

export interface QuizResultsSummary {
  quizId: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  attempts: QuizAttemptResultItem[];
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestionItem[];
}

export interface QuizQuestionItem {
  questionId: number;
  questionVersionId: number;
  order: number;
  content: string;
  questionType: QuestionType;
  answers: QuestionAnswerOption[];
}

export interface QuestionAnswerOption {
  id: number;
  content: string;
  isCorrect?: boolean;
}

export interface QuestionSummary {
  id: number;
  categoryId: number;
  categoryName: string;
  ownerId: number;
  authorName: string;
  currentVersionId: number;
  versionNumber: number;
  content: string;
  questionType: QuestionType;
  publicQuizCount: number;
  answers?: QuestionAnswerOption[];
}

export type QuestionSummaryResponse = QuestionSummary;

export interface QuestionVersionResponse {
  id: number;
  versionNumber: number;
  content: string;
  questionType: QuestionType;
  createdAt: string;
  isCurrent: boolean;
  answers: QuestionAnswerOption[];
}

export interface QuestionDetailResponse extends QuestionSummary {
  sourceQuestionId?: number | null;
  isActive: boolean;
  createdAt: string;
  versions: QuestionVersionResponse[];
}

export interface CreateQuizQuestionInput {
  id?: number | null;
  order?: number;
  content: string;
  questionType: QuestionType;
  answers: {
    id?: number | null;
    content: string;
    isCorrect: boolean;
  }[];
}

export interface CreateQuizRequest {
  title: string;
  description: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  questionIds?: number[];
  questions?: CreateQuizQuestionInput[];
  quizCode?: string;
}

export interface UpdateQuizRequest {
  title: string;
  description: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  questionIds?: number[];
  questions?: CreateQuizQuestionInput[];
  quizCode?: string;
}

export interface StartAttemptRequest {
  quizId: number;
}

export interface AttemptSummary {
  id: number;
  quizId: number;
  quizTitle: string;
  quizCode?: string;
  categoryName: string;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  totalQuestions: number;
  correctAnswers?: number;
  score?: number;
  timeSpentSeconds?: number;
  isAutoSubmitted: boolean;
}

export interface AttemptDetail {
  id: number;
  quizId: number;
  quizTitle: string;
  status: QuizAttemptStatus;
  startedAt: string;
  expiresAt?: string;
  submittedAt?: string;
  isAutoSubmitted: boolean;
  questions: AttemptQuestion[];
}

export interface AttemptQuestion {
  attemptQuestionId: number;
  questionId: number;
  questionVersionId: number;
  order: number;
  content: string;
  questionType: QuestionType;
  answers: { id: number; content: string }[];
  selectedAnswerIds: number[];
}

export interface AttemptResult {
  attemptId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpentSeconds: number;
  isAutoSubmitted: boolean;
  questions: AttemptQuestionResult[];
}

export interface AttemptQuestionResult {
  questionId: number;
  questionVersionId: number;
  order: number;
  content: string;
  isCorrect: boolean;
  answers: {
    id: number;
    content: string;
    isCorrect: boolean;
    isSelected: boolean;
  }[];
}

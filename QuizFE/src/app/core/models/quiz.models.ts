export type QuizVisibility = 0 | 1; // 0 = Private, 1 = Public
export type QuizAttemptStatus = 0 | 1; // 0 = InProgress, 1 = Submitted
export type QuestionType = 0 | 1; // 0 = SingleChoice, 1 = MultipleChoice

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
  quizCode: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  categoryName: string;
  ownerId?: number;
  ownerDisplayName?: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface CreateQuizRequest {
  title: string;
  description: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  questionIds: number[];
}

export interface UpdateQuizRequest {
  title: string;
  description: string;
  duration: number;
  maxAttempts: number;
  visibility: QuizVisibility;
  categoryId: number;
  questionIds: number[];
}

export interface StartAttemptRequest {
  quizCode: string;
}

export interface AttemptSummary {
  id: number;
  quizId: number;
  quizTitle: string;
  quizCode: string;
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

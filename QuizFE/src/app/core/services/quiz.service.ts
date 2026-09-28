import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttemptDetail,
  AttemptResult,
  AttemptSummary,
  Category,
  CreateQuizRequest,
  QuizDetail,
  QuizSummary,
  StartAttemptRequest,
  UpdateQuizRequest
} from '../models/quiz.models';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      catchError(() => of([
        { id: 1, name: 'Science & Physics', description: 'Cosmology, mechanics, and physical laws' },
        { id: 2, name: 'Technology & Web', description: 'Web runtimes, frameworks, and architecture' },
        { id: 3, name: 'Geography & World', description: 'Capitals, flags, and geopolitical insights' },
        { id: 4, name: 'Biology & Genetics', description: 'Cellular systems, RNA, and microbiology' },
        { id: 5, name: 'Mathematics', description: 'Linear algebra, calculus, and discrete math' },
        { id: 6, name: 'General Knowledge', description: 'Trivia, history, and active recall sprints' }
      ]))
    );
  }

  // Quizzes
  getQuizzes(): Observable<QuizSummary[]> {
    return this.http.get<QuizSummary[]>(`${this.baseUrl}/quizzes`).pipe(
      catchError(() => of(this.getMockQuizzes()))
    );
  }

  getMyQuizzes(): Observable<QuizSummary[]> {
    return this.http.get<QuizSummary[]>(`${this.baseUrl}/quizzes/mine`).pipe(
      catchError(() => of(this.getMockQuizzes().filter(q => q.ownerId === 1 || q.visibility === 1)))
    );
  }

  getQuizById(id: number): Observable<QuizDetail> {
    return this.http.get<QuizDetail>(`${this.baseUrl}/quizzes/${id}`).pipe(
      catchError(() => {
        const mock = this.getMockQuizzes().find(q => q.id === id) || this.getMockQuizzes()[0];
        const detail: QuizDetail = {
          ...mock,
          questions: [
            {
              questionId: 101,
              questionVersionId: 201,
              order: 1,
              content: 'What is the primary mechanism of heat transfer in the Sun’s convective zone?',
              questionType: 0,
              answers: [
                { id: 1, content: 'Bulk plasma circulation (rising hot gas, sinking cool gas)', isCorrect: true },
                { id: 2, content: 'Electromagnetic radiation via photon diffusion', isCorrect: false },
                { id: 3, content: 'Direct electron conduction across magnetic flux tubes', isCorrect: false },
                { id: 4, content: 'Neutrino emission flux', isCorrect: false }
              ]
            },
            {
              questionId: 102,
              questionVersionId: 202,
              order: 2,
              content: 'Which planetary body exhibits retrograde orbital motion around Neptune?',
              questionType: 0,
              answers: [
                { id: 5, content: 'Triton (Captured Kuiper Belt Object)', isCorrect: true },
                { id: 6, content: 'Proteus', isCorrect: false },
                { id: 7, content: 'Nereid', isCorrect: false },
                { id: 8, content: 'Larissa', isCorrect: false }
              ]
            },
            {
              questionId: 103,
              questionVersionId: 203,
              order: 3,
              content: 'Which of the following bodies are classified as Gas Giants in our solar system? (Select all)',
              questionType: 1,
              answers: [
                { id: 9, content: 'Jupiter', isCorrect: true },
                { id: 10, content: 'Saturn', isCorrect: true },
                { id: 11, content: 'Uranus (Ice Giant)', isCorrect: false },
                { id: 12, content: 'Mars', isCorrect: false }
              ]
            }
          ]
        };
        return of(detail);
      })
    );
  }

  getQuizByCode(code: string): Observable<QuizSummary> {
    return this.http.get<QuizSummary>(`${this.baseUrl}/quizzes/code/${code}`).pipe(
      catchError(() => {
        const match = this.getMockQuizzes().find(q => q.quizCode.toLowerCase() === code.toLowerCase());
        return match ? of(match) : of(this.getMockQuizzes()[0]);
      })
    );
  }

  createQuiz(request: CreateQuizRequest): Observable<QuizDetail> {
    return this.http.post<QuizDetail>(`${this.baseUrl}/quizzes`, request);
  }

  updateQuiz(id: number, request: UpdateQuizRequest): Observable<QuizDetail> {
    return this.http.put<QuizDetail>(`${this.baseUrl}/quizzes/${id}`, request);
  }

  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}`);
  }

  // Attempts
  getMyAttempts(): Observable<AttemptSummary[]> {
    return this.http.get<AttemptSummary[]>(`${this.baseUrl}/quiz-attempts/mine`).pipe(
      catchError(() => of(this.getMockAttempts()))
    );
  }

  startAttempt(request: StartAttemptRequest): Observable<AttemptDetail> {
    return this.http.post<AttemptDetail>(`${this.baseUrl}/quiz-attempts`, request);
  }

  resumeAttempt(quizCode: string): Observable<AttemptDetail> {
    return this.http.get<AttemptDetail>(`${this.baseUrl}/quiz-attempts/resume/${quizCode}`);
  }

  getAttempt(id: number): Observable<AttemptDetail> {
    return this.http.get<AttemptDetail>(`${this.baseUrl}/quiz-attempts/${id}`);
  }

  saveAnswer(attemptId: number, attemptQuestionId: number, selectedAnswerIds: number[]): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/quiz-attempts/${attemptId}/answers/${attemptQuestionId}`,
      { selectedAnswerIds }
    ).pipe(
      catchError(() => of(void 0))
    );
  }

  submitAttempt(attemptId: number): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(`${this.baseUrl}/quiz-attempts/${attemptId}/submit`, {});
  }

  getAttemptResult(attemptId: number): Observable<AttemptResult> {
    return this.http.get<AttemptResult>(`${this.baseUrl}/quiz-attempts/${attemptId}/result`).pipe(
      catchError(() => of(this.getMockAttemptResult(attemptId)))
    );
  }

  // Sample Mock Fallbacks
  private getMockQuizzes(): QuizSummary[] {
    return [
      {
        id: 1,
        title: 'Solar System & Planetary Physics',
        description: 'Deep space mechanics, orbital harmonics, Keplerian trajectories, and solar weather dynamics.',
        quizCode: 'ASTRO9',
        duration: 15,
        maxAttempts: 3,
        visibility: 1,
        categoryId: 1,
        categoryName: 'Science & Physics',
        ownerId: 1,
        ownerDisplayName: 'Dr. Stella Vance',
        questionCount: 12,
        createdAt: '2026-09-18T10:00:00Z',
        updatedAt: '2026-09-24T14:30:00Z'
      },
      {
        id: 2,
        title: 'Modern Web Engineering & Runtimes',
        description: 'V8 event loops, microtasks, HTTP/3 QUIC streams, hydration mechanics, and WebAssembly boundary calls.',
        quizCode: 'JSV801',
        duration: 20,
        maxAttempts: 2,
        visibility: 1,
        categoryId: 2,
        categoryName: 'Technology & Web',
        ownerId: 2,
        ownerDisplayName: 'Marcus Brody',
        questionCount: 15,
        createdAt: '2026-09-19T08:00:00Z',
        updatedAt: '2026-09-25T11:15:00Z'
      },
      {
        id: 3,
        title: 'Global Cartography & Microstates',
        description: 'European principalities, exclaves, border anomalies, Pacific atoll nations, and sovereign capitals.',
        quizCode: 'GEO554',
        duration: 10,
        maxAttempts: 5,
        visibility: 1,
        categoryId: 3,
        categoryName: 'Geography & World',
        ownerId: 1,
        ownerDisplayName: 'Elena Rostova',
        questionCount: 10,
        createdAt: '2026-09-20T12:00:00Z',
        updatedAt: '2026-09-26T09:40:00Z'
      },
      {
        id: 4,
        title: 'Cellular Biology & Genetics',
        description: 'Mitochondrial DNA, CRISPR-Cas9 target recognition, ribosomal protein translation, and meiosis crossovers.',
        quizCode: 'BIO204',
        duration: 25,
        maxAttempts: 2,
        visibility: 1,
        categoryId: 4,
        categoryName: 'Biology & Genetics',
        ownerId: 3,
        ownerDisplayName: 'Prof. Julian Lee',
        questionCount: 18,
        createdAt: '2026-09-21T14:20:00Z',
        updatedAt: '2026-09-27T16:00:00Z'
      },
      {
        id: 5,
        title: 'Machine Learning & Neural Nets Basics',
        description: 'Backpropagation gradients, transformer attention heads, loss curves, and activation functions.',
        quizCode: 'ML8812',
        duration: 15,
        maxAttempts: 3,
        visibility: 1,
        categoryId: 2,
        categoryName: 'Technology & Web',
        ownerId: 1,
        ownerDisplayName: 'Alex Mercer',
        questionCount: 14,
        createdAt: '2026-09-22T09:10:00Z',
        updatedAt: '2026-09-27T18:00:00Z'
      }
    ];
  }

  private getMockAttempts(): AttemptSummary[] {
    return [
      {
        id: 1001,
        quizId: 1,
        quizTitle: 'Solar System & Planetary Physics',
        quizCode: 'ASTRO9',
        categoryName: 'Science & Physics',
        status: 1,
        startedAt: '2026-09-27T14:10:00Z',
        submittedAt: '2026-09-27T14:22:15Z',
        totalQuestions: 12,
        correctAnswers: 11,
        score: 92,
        timeSpentSeconds: 735,
        isAutoSubmitted: false
      },
      {
        id: 1002,
        quizId: 2,
        quizTitle: 'Web Development & Modern JS',
        quizCode: 'JSV801',
        categoryName: 'Technology & Web',
        status: 1,
        startedAt: '2026-09-26T19:00:00Z',
        submittedAt: '2026-09-26T19:14:40Z',
        totalQuestions: 15,
        correctAnswers: 12,
        score: 80,
        timeSpentSeconds: 880,
        isAutoSubmitted: false
      },
      {
        id: 1003,
        quizId: 3,
        quizTitle: 'World Capitals & Geopolitics',
        quizCode: 'GEO554',
        categoryName: 'Geography & World',
        status: 1,
        startedAt: '2026-09-25T11:30:00Z',
        submittedAt: '2026-09-25T11:38:20Z',
        totalQuestions: 10,
        correctAnswers: 10,
        score: 100,
        timeSpentSeconds: 500,
        isAutoSubmitted: false
      }
    ];
  }

  private getMockActiveAttempt(): AttemptDetail {
    return {
      id: 1001,
      quizId: 1,
      quizTitle: 'Solar System & Planetary Physics',
      status: 0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      isAutoSubmitted: false,
      questions: [
        {
          attemptQuestionId: 1,
          questionId: 101,
          questionVersionId: 201,
          order: 1,
          content: 'What is the primary mechanism of heat transfer in the Sun’s convective zone?',
          questionType: 0,
          answers: [
            { id: 1, content: 'Bulk plasma circulation (rising hot gas, sinking cool gas)' },
            { id: 2, content: 'Electromagnetic radiation via photon diffusion' },
            { id: 3, content: 'Direct electron conduction across magnetic flux tubes' },
            { id: 4, content: 'Neutrino emission flux' }
          ],
          selectedAnswerIds: [1]
        },
        {
          attemptQuestionId: 2,
          questionId: 102,
          questionVersionId: 202,
          order: 2,
          content: 'Which planetary body exhibits retrograde orbital motion around Neptune?',
          questionType: 0,
          answers: [
            { id: 5, content: 'Triton (Captured Kuiper Belt Object)' },
            { id: 6, content: 'Proteus' },
            { id: 7, content: 'Nereid' },
            { id: 8, content: 'Larissa' }
          ],
          selectedAnswerIds: []
        },
        {
          attemptQuestionId: 3,
          questionId: 103,
          questionVersionId: 203,
          order: 3,
          content: 'Which astronomical boundary marks where the solar wind velocity drops below the speed of sound?',
          questionType: 0,
          answers: [
            { id: 9, content: 'Termination Shock' },
            { id: 10, content: 'Heliopause' },
            { id: 11, content: 'Bow Shock' },
            { id: 12, content: 'Kuiper Cliff' }
          ],
          selectedAnswerIds: []
        },
        {
          attemptQuestionId: 4,
          questionId: 104,
          questionVersionId: 204,
          order: 4,
          content: 'Which spacecraft was the first to enter the interstellar medium outside our heliosphere?',
          questionType: 0,
          answers: [
            { id: 13, content: 'Voyager 1' },
            { id: 14, content: 'Voyager 2' },
            { id: 15, content: 'Pioneer 10' },
            { id: 16, content: 'New Horizons' }
          ],
          selectedAnswerIds: []
        },
        {
          attemptQuestionId: 5,
          questionId: 105,
          questionVersionId: 205,
          order: 5,
          content: 'Which of the following statements about Jupiter’s Great Red Spot are correct? (Select all that apply)',
          questionType: 1,
          answers: [
            { id: 17, content: 'It is a persistent anticyclonic storm' },
            { id: 18, content: 'It rotates counterclockwise in the southern hemisphere' },
            { id: 19, content: 'It has expanded to twice its 19th-century diameter' },
            { id: 20, content: 'Its cloud tops are significantly higher and colder than surrounding clouds' }
          ],
          selectedAnswerIds: []
        }
      ]
    };
  }

  private getMockAttemptResult(attemptId: number): AttemptResult {
    return {
      attemptId,
      score: 85,
      totalQuestions: 5,
      correctAnswers: 4,
      incorrectAnswers: 1,
      timeSpentSeconds: 340,
      isAutoSubmitted: false,
      questions: [
        {
          questionId: 101,
          questionVersionId: 201,
          order: 1,
          content: 'What is the primary mechanism of heat transfer in the Sun’s convective zone?',
          isCorrect: true,
          answers: [
            { id: 1, content: 'Bulk plasma circulation (rising hot gas, sinking cool gas)', isCorrect: true, isSelected: true },
            { id: 2, content: 'Electromagnetic radiation via photon diffusion', isCorrect: false, isSelected: false },
            { id: 3, content: 'Direct electron conduction across magnetic flux tubes', isCorrect: false, isSelected: false },
            { id: 4, content: 'Neutrino emission flux', isCorrect: false, isSelected: false }
          ]
        },
        {
          questionId: 102,
          questionVersionId: 202,
          order: 2,
          content: 'Which planetary body exhibits retrograde orbital motion around Neptune?',
          isCorrect: true,
          answers: [
            { id: 5, content: 'Triton (Captured Kuiper Belt Object)', isCorrect: true, isSelected: true },
            { id: 6, content: 'Proteus', isCorrect: false, isSelected: false },
            { id: 7, content: 'Nereid', isCorrect: false, isSelected: false }
          ]
        }
      ]
    };
  }
}

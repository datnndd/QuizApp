import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttemptDetail,
  AttemptResult,
  AttemptSummary,
  Category,
  CreateQuizRequest,
  QuestionDetailResponse,
  QuestionSummary,
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
        { id: 1, name: 'Mathematics', description: 'Algebra, calculus, and discrete mathematics' },
        { id: 2, name: 'Science', description: 'Physics, chemistry, biology, and natural science' },
        { id: 3, name: 'AI', description: 'Machine learning, deep learning, and neural networks' },
        { id: 4, name: 'Programming', description: 'Modern C#, TypeScript, web runtimes, and engineering' },
        { id: 5, name: 'English', description: 'Grammar, vocabulary, and linguistic analysis' },
        { id: 6, name: 'History', description: 'Ancient civilizations, world milestones, and trade routes' }
      ]))
    );
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, { name }).pipe(
      catchError(() => of({
        id: Date.now(),
        name
      }))
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
        const match = this.getMockQuizzes().find(q => q.quizCode?.toLowerCase() === code.toLowerCase());
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

  // Question Bank
  getExploreQuestions(search?: string, categoryId?: number): Observable<QuestionSummary[]> {
    let params = new HttpParams();
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (categoryId !== undefined && categoryId !== null && categoryId > 0) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<QuestionSummary[]>(`${this.baseUrl}/questions/explore`, { params }).pipe(
      catchError(() => {
        let list = this.getMockQuestionSummaries();
        if (search && search.trim().length > 0) {
          const s = search.trim().toLowerCase();
          list = list.filter(q => q.content.toLowerCase().includes(s));
        }
        if (categoryId !== undefined && categoryId !== null && categoryId > 0) {
          list = list.filter(q => q.categoryId === Number(categoryId));
        }
        return of(list);
      })
    );
  }

  getMyQuestions(): Observable<QuestionSummary[]> {
    return this.http.get<QuestionSummary[]>(`${this.baseUrl}/questions/mine`).pipe(
      catchError(() => {
        return of(this.getMockQuestionSummaries().filter(q => q.ownerId === 1));
      })
    );
  }

  getQuestionDetail(id: number): Observable<QuestionDetailResponse> {
    return this.http.get<QuestionDetailResponse>(`${this.baseUrl}/questions/${id}`).pipe(
      catchError(() => {
        const detail = this.getMockQuestionDetails().find(q => q.id === id);
        if (detail) {
          return of(detail);
        }
        const summary = this.getMockQuestionSummaries().find(q => q.id === id);
        const fallback: QuestionDetailResponse = {
          id: summary ? summary.id : id,
          categoryId: summary ? summary.categoryId : 1,
          categoryName: summary ? summary.categoryName : 'General Knowledge',
          ownerId: summary ? summary.ownerId : 1,
          authorName: summary ? summary.authorName : 'Dr. Stella Vance',
          currentVersionId: summary ? summary.currentVersionId : 201,
          versionNumber: summary ? summary.versionNumber : 1,
          content: summary ? summary.content : 'Sample bank question statement...',
          questionType: summary ? summary.questionType : 0,
          publicQuizCount: summary ? summary.publicQuizCount : 1,
          isActive: true,
          createdAt: '2026-09-20T10:00:00Z',
          versions: [
            {
              id: summary ? summary.currentVersionId : 201,
              versionNumber: 1,
              content: summary ? summary.content : 'Sample bank question statement...',
              questionType: summary ? summary.questionType : 0,
              createdAt: '2026-09-20T10:00:00Z',
              isCurrent: true,
              answers: summary?.answers || [
                { id: 1, content: 'Option A (Correct)', isCorrect: true },
                { id: 2, content: 'Option B', isCorrect: false },
                { id: 3, content: 'Option C', isCorrect: false },
                { id: 4, content: 'Option D', isCorrect: false }
              ]
            }
          ]
        };
        return of(fallback);
      })
    );
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

  resumeAttempt(quizId: number): Observable<AttemptDetail> {
    return this.http.get<AttemptDetail>(`${this.baseUrl}/quiz-attempts/resume/${quizId}`);
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

  private getMockQuestionDetails(): QuestionDetailResponse[] {
    return [
      {
        id: 101,
        categoryId: 1,
        categoryName: 'Science & Physics',
        ownerId: 1,
        authorName: 'Dr. Stella Vance',
        currentVersionId: 201,
        versionNumber: 1,
        content: 'What is the primary mechanism of heat transfer in the Sun’s convective zone?',
        questionType: 0,
        publicQuizCount: 4,
        isActive: true,
        createdAt: '2026-09-20T10:00:00Z',
        answers: [
          { id: 1, content: 'Bulk plasma circulation (rising hot gas, sinking cool gas)', isCorrect: true },
          { id: 2, content: 'Electromagnetic radiation via photon diffusion', isCorrect: false },
          { id: 3, content: 'Direct electron conduction across magnetic flux tubes', isCorrect: false },
          { id: 4, content: 'Neutrino emission flux', isCorrect: false }
        ],
        versions: [
          {
            id: 201,
            versionNumber: 1,
            content: 'What is the primary mechanism of heat transfer in the Sun’s convective zone?',
            questionType: 0,
            createdAt: '2026-09-20T10:00:00Z',
            isCurrent: true,
            answers: [
              { id: 1, content: 'Bulk plasma circulation (rising hot gas, sinking cool gas)', isCorrect: true },
              { id: 2, content: 'Electromagnetic radiation via photon diffusion', isCorrect: false },
              { id: 3, content: 'Direct electron conduction across magnetic flux tubes', isCorrect: false },
              { id: 4, content: 'Neutrino emission flux', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 102,
        categoryId: 1,
        categoryName: 'Science & Physics',
        ownerId: 1,
        authorName: 'Dr. Stella Vance',
        currentVersionId: 202,
        versionNumber: 1,
        content: 'Which planetary body exhibits retrograde orbital motion around Neptune?',
        questionType: 0,
        publicQuizCount: 3,
        isActive: true,
        createdAt: '2026-09-21T11:00:00Z',
        answers: [
          { id: 5, content: 'Triton (Captured Kuiper Belt Object)', isCorrect: true },
          { id: 6, content: 'Proteus', isCorrect: false },
          { id: 7, content: 'Nereid', isCorrect: false },
          { id: 8, content: 'Larissa', isCorrect: false }
        ],
        versions: [
          {
            id: 202,
            versionNumber: 1,
            content: 'Which planetary body exhibits retrograde orbital motion around Neptune?',
            questionType: 0,
            createdAt: '2026-09-21T11:00:00Z',
            isCurrent: true,
            answers: [
              { id: 5, content: 'Triton (Captured Kuiper Belt Object)', isCorrect: true },
              { id: 6, content: 'Proteus', isCorrect: false },
              { id: 7, content: 'Nereid', isCorrect: false },
              { id: 8, content: 'Larissa', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 103,
        categoryId: 1,
        categoryName: 'Science & Physics',
        ownerId: 1,
        authorName: 'Dr. Stella Vance',
        currentVersionId: 203,
        versionNumber: 1,
        content: 'Which of the following bodies are classified as Gas Giants in our solar system? (Select all)',
        questionType: 1,
        publicQuizCount: 2,
        isActive: true,
        createdAt: '2026-09-22T09:30:00Z',
        answers: [
          { id: 9, content: 'Jupiter', isCorrect: true },
          { id: 10, content: 'Saturn', isCorrect: true },
          { id: 11, content: 'Uranus (Ice Giant)', isCorrect: false },
          { id: 12, content: 'Mars', isCorrect: false }
        ],
        versions: [
          {
            id: 203,
            versionNumber: 1,
            content: 'Which of the following bodies are classified as Gas Giants in our solar system? (Select all)',
            questionType: 1,
            createdAt: '2026-09-22T09:30:00Z',
            isCurrent: true,
            answers: [
              { id: 9, content: 'Jupiter', isCorrect: true },
              { id: 10, content: 'Saturn', isCorrect: true },
              { id: 11, content: 'Uranus (Ice Giant)', isCorrect: false },
              { id: 12, content: 'Mars', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 104,
        categoryId: 1,
        categoryName: 'Science & Physics',
        ownerId: 2,
        authorName: 'Marcus Brody',
        currentVersionId: 204,
        versionNumber: 1,
        content: 'The Kuiper Cliff marks the sudden drop in spatial density of Kuiper belt objects beyond 50 AU.',
        questionType: 2,
        publicQuizCount: 2,
        isActive: true,
        createdAt: '2026-09-23T14:15:00Z',
        answers: [
          { id: 13, content: 'True', isCorrect: true },
          { id: 14, content: 'False', isCorrect: false }
        ],
        versions: [
          {
            id: 204,
            versionNumber: 1,
            content: 'The Kuiper Cliff marks the sudden drop in spatial density of Kuiper belt objects beyond 50 AU.',
            questionType: 2,
            createdAt: '2026-09-23T14:15:00Z',
            isCurrent: true,
            answers: [
              { id: 13, content: 'True', isCorrect: true },
              { id: 14, content: 'False', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 201,
        categoryId: 2,
        categoryName: 'Technology & Web',
        ownerId: 2,
        authorName: 'Marcus Brody',
        currentVersionId: 301,
        versionNumber: 1,
        content: 'In the V8 JavaScript engine, which tier is responsible for baseline bytecode interpretation?',
        questionType: 0,
        publicQuizCount: 5,
        isActive: true,
        createdAt: '2026-09-24T08:00:00Z',
        answers: [
          { id: 15, content: 'Ignition Interpreter', isCorrect: true },
          { id: 16, content: 'TurboFan Compiler', isCorrect: false },
          { id: 17, content: 'Sparkplug Baseline', isCorrect: false },
          { id: 18, content: 'Maglev JIT', isCorrect: false }
        ],
        versions: [
          {
            id: 301,
            versionNumber: 1,
            content: 'In the V8 JavaScript engine, which tier is responsible for baseline bytecode interpretation?',
            questionType: 0,
            createdAt: '2026-09-24T08:00:00Z',
            isCurrent: true,
            answers: [
              { id: 15, content: 'Ignition Interpreter', isCorrect: true },
              { id: 16, content: 'TurboFan Compiler', isCorrect: false },
              { id: 17, content: 'Sparkplug Baseline', isCorrect: false },
              { id: 18, content: 'Maglev JIT', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 202,
        categoryId: 2,
        categoryName: 'Technology & Web',
        ownerId: 1,
        authorName: 'Dr. Stella Vance',
        currentVersionId: 302,
        versionNumber: 1,
        content: 'Which HTTP headers are essential for enabling Cross-Origin Resource Sharing (CORS) preflight? (Select all)',
        questionType: 1,
        publicQuizCount: 3,
        isActive: true,
        createdAt: '2026-09-24T10:30:00Z',
        answers: [
          { id: 19, content: 'Access-Control-Allow-Origin', isCorrect: true },
          { id: 20, content: 'Access-Control-Allow-Methods', isCorrect: true },
          { id: 21, content: 'X-Requested-With', isCorrect: false },
          { id: 22, content: 'Host', isCorrect: false }
        ],
        versions: [
          {
            id: 302,
            versionNumber: 1,
            content: 'Which HTTP headers are essential for enabling Cross-Origin Resource Sharing (CORS) preflight? (Select all)',
            questionType: 1,
            createdAt: '2026-09-24T10:30:00Z',
            isCurrent: true,
            answers: [
              { id: 19, content: 'Access-Control-Allow-Origin', isCorrect: true },
              { id: 20, content: 'Access-Control-Allow-Methods', isCorrect: true },
              { id: 21, content: 'X-Requested-With', isCorrect: false },
              { id: 22, content: 'Host', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 203,
        categoryId: 2,
        categoryName: 'Technology & Web',
        ownerId: 2,
        authorName: 'Marcus Brody',
        currentVersionId: 303,
        versionNumber: 1,
        content: 'HTTP/3 uses QUIC over UDP to eliminate head-of-line blocking at the transport layer.',
        questionType: 2,
        publicQuizCount: 4,
        isActive: true,
        createdAt: '2026-09-25T12:00:00Z',
        answers: [
          { id: 23, content: 'True', isCorrect: true },
          { id: 24, content: 'False', isCorrect: false }
        ],
        versions: [
          {
            id: 303,
            versionNumber: 1,
            content: 'HTTP/3 uses QUIC over UDP to eliminate head-of-line blocking at the transport layer.',
            questionType: 2,
            createdAt: '2026-09-25T12:00:00Z',
            isCurrent: true,
            answers: [
              { id: 23, content: 'True', isCorrect: true },
              { id: 24, content: 'False', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 301,
        categoryId: 3,
        categoryName: 'Geography & World',
        ownerId: 3,
        authorName: 'Elena Rostova',
        currentVersionId: 401,
        versionNumber: 1,
        content: 'What is the capital city of the European principality of Liechtenstein?',
        questionType: 0,
        publicQuizCount: 2,
        isActive: true,
        createdAt: '2026-09-25T15:20:00Z',
        answers: [
          { id: 25, content: 'Vaduz', isCorrect: true },
          { id: 26, content: 'Schaan', isCorrect: false },
          { id: 27, content: 'Balzers', isCorrect: false },
          { id: 28, content: 'Triesen', isCorrect: false }
        ],
        versions: [
          {
            id: 401,
            versionNumber: 1,
            content: 'What is the capital city of the European principality of Liechtenstein?',
            questionType: 0,
            createdAt: '2026-09-25T15:20:00Z',
            isCurrent: true,
            answers: [
              { id: 25, content: 'Vaduz', isCorrect: true },
              { id: 26, content: 'Schaan', isCorrect: false },
              { id: 27, content: 'Balzers', isCorrect: false },
              { id: 28, content: 'Triesen', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: 401,
        categoryId: 4,
        categoryName: 'Biology & Genetics',
        ownerId: 1,
        authorName: 'Dr. Stella Vance',
        currentVersionId: 501,
        versionNumber: 1,
        content: 'Which cellular organelle contains its own circular DNA and reproduces independently inside eukaryotic cells?',
        questionType: 0,
        publicQuizCount: 3,
        isActive: true,
        createdAt: '2026-09-26T09:10:00Z',
        answers: [
          { id: 29, content: 'Mitochondria', isCorrect: true },
          { id: 30, content: 'Endoplasmic Reticulum', isCorrect: false },
          { id: 31, content: 'Golgi Apparatus', isCorrect: false },
          { id: 32, content: 'Lysosome', isCorrect: false }
        ],
        versions: [
          {
            id: 501,
            versionNumber: 1,
            content: 'Which cellular organelle contains its own circular DNA and reproduces independently inside eukaryotic cells?',
            questionType: 0,
            createdAt: '2026-09-26T09:10:00Z',
            isCurrent: true,
            answers: [
              { id: 29, content: 'Mitochondria', isCorrect: true },
              { id: 30, content: 'Endoplasmic Reticulum', isCorrect: false },
              { id: 31, content: 'Golgi Apparatus', isCorrect: false },
              { id: 32, content: 'Lysosome', isCorrect: false }
            ]
          }
        ]
      }
    ];
  }

  private getMockQuestionSummaries(): QuestionSummary[] {
    return this.getMockQuestionDetails().map(d => ({
      id: d.id,
      categoryId: d.categoryId,
      categoryName: d.categoryName,
      ownerId: d.ownerId,
      authorName: d.authorName,
      currentVersionId: d.currentVersionId,
      versionNumber: d.versionNumber,
      content: d.content,
      questionType: d.questionType,
      publicQuizCount: d.publicQuizCount,
      answers: d.answers
    }));
  }
}

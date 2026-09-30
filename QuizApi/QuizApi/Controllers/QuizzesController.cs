using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Quizzes;
using QuizApi.Extensions;
using QuizApi.Models;

namespace QuizApi.Controllers;

[Authorize]
[ApiController]
[Route("api/quizzes")]
public class QuizzesController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<QuizResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        var query = context.Quizzes.AsNoTracking();
        if (!isAdmin)
        {
            query = query.Where(q => q.IsActive && (q.Visibility == QuizVisibility.Public || q.OwnerId == userId));
        }
        var quizzes = await SummaryQuery(query)
            .OrderByDescending(q => q.Id)
            .ToListAsync(cancellationToken);
        return Ok(quizzes);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<QuizResponse>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quizzes = await SummaryQuery(context.Quizzes.AsNoTracking()
                .Where(q => q.OwnerId == userId))
            .OrderByDescending(q => q.Id)
            .ToListAsync(cancellationToken);
        return Ok(quizzes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuizResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var quiz = await LoadAccessibleQuiz(id, User.GetUserId(), User.IsInRole("Admin"), cancellationToken);
        return quiz is null ? NotFound(new { message = "Quiz not found." }) : Ok(quiz);
    }

    [HttpGet("{id:int}/results")]
    public async Task<ActionResult<QuizResultsSummaryResponse>> GetQuizResults(int id, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.AsNoTracking().FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });

        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && quiz.OwnerId != userId) return Forbid();

        var attempts = await context.QuizAttempts.AsNoTracking()
            .Where(a => a.QuizId == id && a.SubmittedAt != null)
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => new QuizAttemptResultItem
            {
                AttemptId = a.Id,
                UserId = a.UserId,
                StudentName = string.IsNullOrEmpty(a.User.DisplayName) ? a.User.UserName : a.User.DisplayName,
                StudentEmail = a.User.Email,
                Score = a.Score ?? 0,
                TotalQuestions = a.TotalQuestions,
                CorrectAnswers = a.CorrectAnswers ?? 0,
                TimeSpentSeconds = a.TimeSpentSeconds ?? 0,
                SubmittedAt = a.SubmittedAt,
                Status = a.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        var totalAttempts = attempts.Count;
        var avgScore = totalAttempts > 0 ? Math.Round(attempts.Average(a => a.Score), 1) : 0;
        var passCount = attempts.Count(a => a.Score >= 50);
        var passRate = totalAttempts > 0 ? Math.Round((double)passCount / totalAttempts * 100, 1) : 0;

        return Ok(new QuizResultsSummaryResponse
        {
            QuizId = quiz.Id,
            TotalAttempts = totalAttempts,
            AverageScore = avgScore,
            PassRate = passRate,
            Attempts = attempts
        });
    }

    [HttpPost]
    public async Task<ActionResult<QuizResponse>> Create(CreateQuizRequest request, CancellationToken cancellationToken)
    {
        if (!await CategoryExists(request.CategoryId, cancellationToken))
        {
            return BadRequest(new { message = "Category not found." });
        }

        var quiz = new Quiz
        {
            OwnerId = User.GetUserId(),
            CategoryId = request.CategoryId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Visibility = request.Visibility,
            Duration = request.Duration,
            MaxAttempts = request.MaxAttempts
        };
        context.Quizzes.Add(quiz);
        await context.SaveChangesAsync(cancellationToken);

        await SyncQuizQuestions(quiz, request, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id },
            await LoadAccessibleQuiz(quiz.Id, quiz.OwnerId, false, cancellationToken));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateQuizRequest request, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });
        if (quiz.OwnerId != User.GetUserId() && !User.IsInRole("Admin")) return Forbid();
        if (!quiz.IsActive)
            return BadRequest(new { message = "Cannot modify a disabled quiz." });
        if (!await CategoryExists(request.CategoryId, cancellationToken))
            return BadRequest(new { message = "Category not found." });

        quiz.Title = request.Title.Trim();
        quiz.Description = request.Description?.Trim();
        quiz.CategoryId = request.CategoryId;
        quiz.Visibility = request.Visibility;
        quiz.Duration = request.Duration;
        quiz.MaxAttempts = request.MaxAttempts;

        if (request.Questions is not null || request.QuestionIds is not null)
        {
            var existingQuizQuestions = await context.QuizQuestions
                .Where(qq => qq.QuizId == id)
                .ToListAsync(cancellationToken);
            context.QuizQuestions.RemoveRange(existingQuizQuestions);
            await context.SaveChangesAsync(cancellationToken);

            await SyncQuizQuestions(quiz, request, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateQuizStatusRequest request, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });
        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && quiz.OwnerId != userId) return Forbid();

        quiz.IsActive = request.IsActive;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new { id = quiz.Id, isActive = quiz.IsActive });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });
        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && quiz.OwnerId != userId) return Forbid();

        quiz.IsActive = false;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/questions")]
    public async Task<ActionResult<QuizQuestionResponse>> AddQuestion(
        int id,
        AddQuizQuestionRequest request,
        CancellationToken cancellationToken)
    {
        var quiz = await OwnedQuiz(id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });

        var question = await context.Questions
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == request.QuestionId && q.IsActive, cancellationToken);
        if (question is null) return BadRequest(new { message = "Question not found." });

        var userId = User.GetUserId();
        var canUse = question.OwnerId == userId || await context.QuizQuestions.AnyAsync(qq =>
            qq.QuestionId == question.Id && qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public,
            cancellationToken);
        if (!canUse) return Forbid();

        if (await context.QuizQuestions.AnyAsync(qq => qq.QuizId == id && qq.QuestionId == question.Id, cancellationToken))
            return Conflict(new { message = "The question is already in this quiz." });

        var versionId = request.QuestionVersionId ?? question.CurrentVersionId;
        var version = await context.QuestionVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == versionId && v.QuestionId == question.Id, cancellationToken);
        if (version is null)
            return BadRequest(new { message = "The selected version does not belong to the question." });

        var nextOrder = (await context.QuizQuestions
            .Where(qq => qq.QuizId == id)
            .MaxAsync(qq => (int?)qq.Order, cancellationToken) ?? 0) + 1;
        context.QuizQuestions.Add(new QuizQuestion
        {
            QuizId = id,
            QuestionId = question.Id,
            QuestionVersionId = version.Id,
            Order = nextOrder
        });
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id }, new QuizQuestionResponse
        {
            QuestionId = question.Id,
            QuestionVersionId = version.Id,
            VersionNumber = version.VersionNumber,
            LatestVersionNumber = await context.QuestionVersions
                .Where(v => v.QuestionId == question.Id)
                .MaxAsync(v => v.VersionNumber, cancellationToken),
            Order = nextOrder,
            Content = version.Content,
            QuestionType = version.QuestionType
        });
    }

    [HttpPut("{id:int}/questions/{questionId:int}/version")]
    public async Task<IActionResult> UpdateQuestionVersion(
        int id,
        int questionId,
        UpdateQuizQuestionVersionRequest request,
        CancellationToken cancellationToken)
    {
        if (await OwnedQuiz(id, cancellationToken) is null)
            return NotFound(new { message = "Quiz not found." });

        var quizQuestion = await context.QuizQuestions
            .FirstOrDefaultAsync(qq => qq.QuizId == id && qq.QuestionId == questionId, cancellationToken);
        if (quizQuestion is null) return NotFound(new { message = "Quiz question not found." });

        var belongsToQuestion = await context.QuestionVersions
            .AnyAsync(v => v.Id == request.QuestionVersionId && v.QuestionId == questionId, cancellationToken);
        if (!belongsToQuestion)
            return BadRequest(new { message = "The selected version does not belong to the question." });

        quizQuestion.QuestionVersionId = request.QuestionVersionId;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}/questions/{questionId:int}")]
    public async Task<IActionResult> RemoveQuestion(int id, int questionId, CancellationToken cancellationToken)
    {
        if (await OwnedQuiz(id, cancellationToken) is null)
            return NotFound(new { message = "Quiz not found." });

        var quizQuestion = await context.QuizQuestions
            .FirstOrDefaultAsync(qq => qq.QuizId == id && qq.QuestionId == questionId, cancellationToken);
        if (quizQuestion is null) return NotFound(new { message = "Quiz question not found." });

        context.QuizQuestions.Remove(quizQuestion);
        await context.SaveChangesAsync(cancellationToken);

        var remaining = await context.QuizQuestions
            .Where(qq => qq.QuizId == id)
            .OrderBy(qq => qq.Order)
            .ToListAsync(cancellationToken);
        for (var index = 0; index < remaining.Count; index++) remaining[index].Order = index + 1;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:int}/preview")]
    public async Task<ActionResult<QuizPreviewResponse>> Preview(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var preview = await context.Quizzes.AsNoTracking()
            .Where(q => q.Id == id && q.IsActive && q.OwnerId == userId)
            .Select(q => new QuizPreviewResponse
            {
                QuizId = q.Id,
                Title = q.Title,
                Duration = q.Duration,
                Questions = q.QuizQuestions.OrderBy(qq => qq.Order)
                    .Select(qq => new QuizPreviewQuestionResponse
                    {
                        QuestionId = qq.QuestionId,
                        QuestionVersionId = qq.QuestionVersionId,
                        Order = qq.Order,
                        Content = qq.QuestionVersion.Content,
                        QuestionType = qq.QuestionVersion.QuestionType,
                        Answers = qq.QuestionVersion.Answers.OrderBy(a => a.Id)
                            .Select(a => new QuizPreviewAnswerResponse
                            {
                                Id = a.Id,
                                Content = a.Content,
                                IsCorrect = a.IsCorrect
                            }).ToList()
                    }).ToList()
            })
            .SingleOrDefaultAsync(cancellationToken);

        return preview is null ? NotFound(new { message = "Quiz not found." }) : Ok(preview);
    }

    private Task<Quiz?> OwnedQuiz(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        return context.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.IsActive && q.OwnerId == userId, cancellationToken);
    }

    private Task<bool> CategoryExists(int categoryId, CancellationToken cancellationToken) =>
        context.Categories.AnyAsync(c => c.Id == categoryId && c.IsActive, cancellationToken);

    private async Task<QuizResponse?> LoadAccessibleQuiz(int id, int userId, bool isAdmin, CancellationToken cancellationToken) =>
        await DetailQuery(context.Quizzes.AsNoTracking().Where(q =>
                q.Id == id && (isAdmin || (q.IsActive ? (q.Visibility == QuizVisibility.Public || q.OwnerId == userId) : q.OwnerId == userId))))
            .SingleOrDefaultAsync(cancellationToken);

    private static IQueryable<QuizResponse> SummaryQuery(IQueryable<Quiz> query) =>
        query.Select(q => new QuizResponse
        {
            Id = q.Id,
            Title = q.Title,
            Description = q.Description,
            CategoryId = q.CategoryId,
            CategoryName = q.Category.Name,
            Visibility = q.Visibility,
            Duration = q.Duration,
            MaxAttempts = q.MaxAttempts,
            IsActive = q.IsActive,
            OwnerId = q.OwnerId,
            OwnerName = q.Owner.DisplayName,
            OwnerDisplayName = q.Owner.DisplayName,
            QuestionCount = q.QuizQuestions.Count
        });

    private static IQueryable<QuizResponse> DetailQuery(IQueryable<Quiz> query) =>
        query.Select(q => new QuizResponse
        {
            Id = q.Id,
            Title = q.Title,
            Description = q.Description,
            CategoryId = q.CategoryId,
            CategoryName = q.Category.Name,
            Visibility = q.Visibility,
            Duration = q.Duration,
            MaxAttempts = q.MaxAttempts,
            IsActive = q.IsActive,
            OwnerId = q.OwnerId,
            OwnerName = q.Owner.DisplayName,
            OwnerDisplayName = q.Owner.DisplayName,
            QuestionCount = q.QuizQuestions.Count,
            Questions = q.QuizQuestions.OrderBy(qq => qq.Order)
                .Select(qq => new QuizQuestionResponse
                {
                    QuestionId = qq.QuestionId,
                    QuestionVersionId = qq.QuestionVersionId,
                    VersionNumber = qq.QuestionVersion.VersionNumber,
                    LatestVersionNumber = qq.Question.Versions.Max(v => (int?)v.VersionNumber) ?? qq.QuestionVersion.VersionNumber,
                    Order = qq.Order,
                    Content = qq.QuestionVersion.Content,
                    QuestionType = qq.QuestionVersion.QuestionType,
                    Answers = qq.QuestionVersion.Answers.OrderBy(a => a.Id)
                        .Select(a => new QuizQuestionAnswerResponse
                        {
                            Id = a.Id,
                            Content = a.Content,
                            IsCorrect = a.IsCorrect
                        }).ToList()
                }).ToList()
        });

    private async Task SyncQuizQuestions(Quiz quiz, CreateQuizRequest request, CancellationToken cancellationToken)
    {
        if (request.Questions is { Count: > 0 })
        {
            var order = 1;
            foreach (var qInput in request.Questions)
            {
                int questionId;
                int versionId;

                var answers = qInput.Answers ?? [];
                if (qInput.QuestionType == QuestionType.TrueFalse && answers.Count == 0)
                {
                    answers =
                    [
                        new QuizAnswerInput { Content = "True", IsCorrect = true },
                        new QuizAnswerInput { Content = "False", IsCorrect = false }
                    ];
                }

                Question? existingQuestion = null;
                if (qInput.Id is > 0)
                {
                    existingQuestion = await context.Questions
                        .Include(q => q.CurrentVersion)
                        .FirstOrDefaultAsync(q => q.Id == qInput.Id && q.IsActive, cancellationToken);
                }

                if (existingQuestion is not null)
                {
                    questionId = existingQuestion.Id;
                    var maxVer = await context.QuestionVersions
                        .Where(v => v.QuestionId == existingQuestion.Id)
                        .MaxAsync(v => (int?)v.VersionNumber, cancellationToken) ?? 1;

                    var newVersion = new QuestionVersion
                    {
                        QuestionId = existingQuestion.Id,
                        VersionNumber = maxVer + 1,
                        Content = string.IsNullOrWhiteSpace(qInput.Content) ? "Untitled question" : qInput.Content.Trim(),
                        QuestionType = qInput.QuestionType,
                        Answers = answers.Select(a => new Answer
                        {
                            Content = string.IsNullOrWhiteSpace(a.Content) ? "Option" : a.Content.Trim(),
                            IsCorrect = a.IsCorrect
                        }).ToList()
                    };
                    context.QuestionVersions.Add(newVersion);
                    await context.SaveChangesAsync(cancellationToken);

                    existingQuestion.CurrentVersionId = newVersion.Id;
                    await context.SaveChangesAsync(cancellationToken);

                    versionId = newVersion.Id;
                }
                else
                {
                    var newQ = new Question
                    {
                        OwnerId = quiz.OwnerId,
                        CategoryId = quiz.CategoryId,
                        IsActive = true
                    };
                    context.Questions.Add(newQ);
                    await context.SaveChangesAsync(cancellationToken);

                    var version = new QuestionVersion
                    {
                        QuestionId = newQ.Id,
                        VersionNumber = 1,
                        Content = string.IsNullOrWhiteSpace(qInput.Content) ? "Untitled question" : qInput.Content.Trim(),
                        QuestionType = qInput.QuestionType,
                        Answers = answers.Select(a => new Answer
                        {
                            Content = string.IsNullOrWhiteSpace(a.Content) ? "Option" : a.Content.Trim(),
                            IsCorrect = a.IsCorrect
                        }).ToList()
                    };
                    context.QuestionVersions.Add(version);
                    await context.SaveChangesAsync(cancellationToken);

                    newQ.CurrentVersionId = version.Id;
                    await context.SaveChangesAsync(cancellationToken);

                    questionId = newQ.Id;
                    versionId = version.Id;
                }

                context.QuizQuestions.Add(new QuizQuestion
                {
                    QuizId = quiz.Id,
                    QuestionId = questionId,
                    QuestionVersionId = versionId,
                    Order = qInput.Order > 0 ? qInput.Order : order++
                });
            }
            await context.SaveChangesAsync(cancellationToken);
        }
        else if (request.QuestionIds is { Count: > 0 })
        {
            var validQuestions = await context.Questions
                .Where(q => request.QuestionIds.Contains(q.Id) && q.IsActive && q.CurrentVersionId.HasValue)
                .Select(q => new { q.Id, CurrentVersionId = q.CurrentVersionId!.Value })
                .ToListAsync(cancellationToken);

            var order = 1;
            foreach (var qId in request.QuestionIds)
            {
                var q = validQuestions.FirstOrDefault(vq => vq.Id == qId);
                if (q != null)
                {
                    context.QuizQuestions.Add(new QuizQuestion
                    {
                        QuizId = quiz.Id,
                        QuestionId = q.Id,
                        QuestionVersionId = q.CurrentVersionId,
                        Order = order++
                    });
                }
            }
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

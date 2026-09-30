using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Attempts;
using QuizApi.Extensions;
using QuizApi.Models;
using QuizApi.Services;

namespace QuizApi.Controllers;

[Authorize]
[ApiController]
[Route("api/quiz-attempts")]
public class QuizAttemptsController(
    AppDbContext context,
    QuizAttemptService attemptService,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<UserAttemptSummaryResponse>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var attempts = await context.QuizAttempts.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.StartedAt)
            .Select(a => new UserAttemptSummaryResponse
            {
                Id = a.Id,
                QuizId = a.QuizId,
                QuizTitle = a.Quiz.Title,
                CategoryName = a.Quiz.Category.Name,
                Status = a.Status,
                StartedAt = a.StartedAt,
                SubmittedAt = a.SubmittedAt,
                TotalQuestions = a.TotalQuestions,
                CorrectAnswers = a.CorrectAnswers,
                Score = a.Score,
                TimeSpentSeconds = a.TimeSpentSeconds,
                IsAutoSubmitted = a.IsAutoSubmitted,
                IsQuizDeleted = a.Quiz.IsDeleted,
                IsQuizActive = a.Quiz.IsActive
            })
            .ToListAsync(cancellationToken);

        return Ok(attempts);
    }

    [HttpPost]
    public async Task<ActionResult<AttemptResponse>> Start(
        StartAttemptRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quiz = await context.Quizzes
            .Include(q => q.QuizQuestions)
            .SingleOrDefaultAsync(q => q.Id == request.QuizId && q.IsActive && !q.IsDeleted, cancellationToken);

        if (quiz is null) return NotFound(new { message = "Invalid quiz." });
        if (quiz.Visibility != QuizVisibility.Public && quiz.OwnerId != userId) return Forbid();

        await using var transaction = context.Database.IsRelational()
            ? await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            : null;
        var usedAttempts = await context.QuizAttempts
            .CountAsync(a => a.QuizId == quiz.Id && a.UserId == userId, cancellationToken);
        if (quiz.MaxAttempts > 0 && usedAttempts >= quiz.MaxAttempts)
            return Conflict(new { message = "Maximum attempt limit reached." });

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var attempt = new QuizAttempt
        {
            QuizId = quiz.Id,
            UserId = userId,
            StartedAt = now,
            ExpiresAt = quiz.Duration == 0 ? null : now.AddMinutes(quiz.Duration),
            Status = QuizAttemptStatus.InProgress,
            TotalQuestions = quiz.QuizQuestions.Count,
            Questions = quiz.QuizQuestions.Select(qq => new QuizAttemptQuestion
            {
                QuestionId = qq.QuestionId,
                QuestionVersionId = qq.QuestionVersionId,
                Order = qq.Order
            }).ToList()
        };
        context.QuizAttempts.Add(attempt);
        await context.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = attempt.Id },
            await LoadAttempt(attempt.Id, userId, cancellationToken));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AttemptResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!await OwnsAttempt(id, userId, cancellationToken))
            return NotFound(new { message = "Attempt not found." });

        await attemptService.SubmitIfExpired(id, cancellationToken);
        return Ok(await LoadAttempt(id, userId, cancellationToken));
    }

    [HttpGet("resume/{quizId:int}")]
    public async Task<ActionResult<AttemptResponse>> Resume(int quizId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var attempt = await context.QuizAttempts
            .Include(a => a.Quiz)
            .Where(a => a.UserId == userId && a.QuizId == quizId && a.Status == QuizAttemptStatus.InProgress)
            .OrderByDescending(a => a.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (attempt is null || attempt.Quiz.IsDeleted) return NotFound(new { message = "No unfinished attempt was found." });
        if (await attemptService.SubmitIfExpired(attempt.Id, cancellationToken))
            return NotFound(new { message = "No unfinished attempt was found." });
        return Ok(await LoadAttempt(attempt.Id, userId, cancellationToken));
    }

    [HttpPut("{id:int}/answers/{attemptQuestionId:int}")]
    public async Task<IActionResult> SaveAnswer(
        int id,
        int attemptQuestionId,
        SaveAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!await OwnsAttempt(id, userId, cancellationToken))
            return NotFound(new { message = "Attempt not found." });
        if (await attemptService.SubmitIfExpired(id, cancellationToken))
            return Conflict(new { message = "The attempt has expired and was submitted automatically." });

        var question = await context.QuizAttemptQuestions
            .Include(q => q.QuizAttempt)
            .Include(q => q.QuestionVersion).ThenInclude(v => v.Answers)
            .Include(q => q.UserAnswers)
            .SingleOrDefaultAsync(q => q.Id == attemptQuestionId && q.QuizAttemptId == id, cancellationToken);
        if (question is null) return NotFound(new { message = "Attempt question not found." });
        if (question.QuizAttempt.Status != QuizAttemptStatus.InProgress)
            return Conflict(new { message = "Answers cannot be changed after submission." });

        var selectedIds = request.SelectedAnswerIds.Distinct().ToHashSet();
        if (selectedIds.Count != request.SelectedAnswerIds.Count)
            return BadRequest(new { message = "Selected answer IDs must be unique." });
        if (question.QuestionVersion.QuestionType != QuestionType.MultipleChoice && selectedIds.Count > 1)
            return BadRequest(new { message = "Only one answer may be selected for this question type." });

        var availableIds = question.QuestionVersion.Answers.Select(a => a.Id).ToHashSet();
        if (!selectedIds.IsSubsetOf(availableIds))
            return BadRequest(new { message = "One or more answers do not belong to this question version." });

        context.UserAnswers.RemoveRange(question.UserAnswers.Where(a => !selectedIds.Contains(a.AnswerId)));
        var existingIds = question.UserAnswers.Select(a => a.AnswerId).ToHashSet();
        context.UserAnswers.AddRange(selectedIds.Except(existingIds).Select(answerId => new UserAnswer
        {
            QuizAttemptQuestionId = question.Id,
            AnswerId = answerId
        }));
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/submit")]
    public async Task<ActionResult<AttemptResultResponse>> Submit(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!await OwnsAttempt(id, userId, cancellationToken))
            return NotFound(new { message = "Attempt not found." });

        var auto = await attemptService.SubmitIfExpired(id, cancellationToken);
        return Ok(auto
            ? await attemptService.GetResult(id, cancellationToken)
            : await attemptService.Submit(id, false, cancellationToken));
    }

    [HttpGet("{id:int}/result")]
    public async Task<ActionResult<AttemptResultResponse>> Result(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!await OwnsAttempt(id, userId, cancellationToken))
            return NotFound(new { message = "Attempt not found." });

        await attemptService.SubmitIfExpired(id, cancellationToken);
        var result = await attemptService.GetResult(id, cancellationToken);
        return result is null
            ? Conflict(new { message = "The attempt has not been submitted." })
            : Ok(result);
    }

    private Task<bool> OwnsAttempt(int id, int userId, CancellationToken cancellationToken) =>
        context.QuizAttempts.AnyAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

    private async Task<AttemptResponse?> LoadAttempt(int id, int userId, CancellationToken cancellationToken) =>
        await context.QuizAttempts.AsNoTracking().AsSplitQuery()
            .Where(a => a.Id == id && a.UserId == userId)
            .Select(a => new AttemptResponse
            {
                Id = a.Id,
                QuizId = a.QuizId,
                QuizTitle = a.Quiz.Title,
                Status = a.Status,
                StartedAt = a.StartedAt,
                ExpiresAt = a.ExpiresAt,
                SubmittedAt = a.SubmittedAt,
                IsAutoSubmitted = a.IsAutoSubmitted,
                Questions = a.Questions.OrderBy(q => q.Order)
                    .Select(q => new AttemptQuestionResponse
                    {
                        AttemptQuestionId = q.Id,
                        QuestionId = q.QuestionId,
                        QuestionVersionId = q.QuestionVersionId,
                        Order = q.Order,
                        Content = q.QuestionVersion.Content,
                        QuestionType = q.QuestionVersion.QuestionType,
                        Answers = q.QuestionVersion.Answers.OrderBy(answer => answer.Id)
                            .Select(answer => new AttemptAnswerOptionResponse
                            {
                                Id = answer.Id,
                                Content = answer.Content
                            }).ToList(),
                        SelectedAnswerIds = q.UserAnswers.Select(ua => ua.AnswerId).ToList()
                    }).ToList()
            })
            .SingleOrDefaultAsync(cancellationToken);
}

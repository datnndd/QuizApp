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
    private const string QuizCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QuizResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quizzes = await SummaryQuery(context.Quizzes.AsNoTracking()
                .Where(q => q.IsActive && (q.Visibility == QuizVisibility.Public || q.OwnerId == userId)))
            .OrderByDescending(q => q.Id)
            .ToListAsync(cancellationToken);
        return Ok(quizzes);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<QuizResponse>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quizzes = await SummaryQuery(context.Quizzes.AsNoTracking()
                .Where(q => q.OwnerId == userId && q.IsActive))
            .OrderByDescending(q => q.Id)
            .ToListAsync(cancellationToken);
        return Ok(quizzes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuizResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var quiz = await LoadAccessibleQuiz(id, User.GetUserId(), cancellationToken);
        return quiz is null ? NotFound(new { message = "Quiz not found." }) : Ok(quiz);
    }

    [HttpGet("code/{quizCode}")]
    public async Task<ActionResult<QuizResponse>> GetByCode(string quizCode, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var normalized = quizCode.Trim().ToUpperInvariant();
        var id = await context.Quizzes
            .Where(q => q.QuizCode == normalized && q.IsActive &&
                        (q.Visibility == QuizVisibility.Public || q.OwnerId == userId))
            .Select(q => (int?)q.Id)
            .SingleOrDefaultAsync(cancellationToken);

        return id is null
            ? NotFound(new { message = "Quiz code is invalid or access is denied." })
            : Ok(await LoadAccessibleQuiz(id.Value, userId, cancellationToken));
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
            QuizCode = await GenerateUniqueQuizCode(cancellationToken),
            Visibility = request.Visibility,
            Duration = request.Duration,
            MaxAttempts = request.MaxAttempts
        };
        context.Quizzes.Add(quiz);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id },
            await LoadAccessibleQuiz(quiz.Id, quiz.OwnerId, cancellationToken));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateQuizRequest request, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.IsActive, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });
        if (quiz.OwnerId != User.GetUserId()) return Forbid();
        if (!await CategoryExists(request.CategoryId, cancellationToken))
            return BadRequest(new { message = "Category not found." });

        quiz.Title = request.Title.Trim();
        quiz.Description = request.Description?.Trim();
        quiz.CategoryId = request.CategoryId;
        quiz.Visibility = request.Visibility;
        quiz.Duration = request.Duration;
        quiz.MaxAttempts = request.MaxAttempts;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var quiz = await context.Quizzes.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });
        if (quiz.OwnerId != User.GetUserId()) return Forbid();

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

    private async Task<string> GenerateUniqueQuizCode(CancellationToken cancellationToken)
    {
        string code;
        do code = RandomNumberGenerator.GetString(QuizCodeAlphabet, 6);
        while (await context.Quizzes.AnyAsync(q => q.QuizCode == code, cancellationToken));
        return code;
    }

    private async Task<QuizResponse?> LoadAccessibleQuiz(int id, int userId, CancellationToken cancellationToken) =>
        await DetailQuery(context.Quizzes.AsNoTracking().Where(q =>
                q.Id == id && q.IsActive && (q.Visibility == QuizVisibility.Public || q.OwnerId == userId)))
            .SingleOrDefaultAsync(cancellationToken);

    private static IQueryable<QuizResponse> SummaryQuery(IQueryable<Quiz> query) =>
        query.Select(q => new QuizResponse
        {
            Id = q.Id,
            Title = q.Title,
            Description = q.Description,
            CategoryId = q.CategoryId,
            CategoryName = q.Category.Name,
            QuizCode = q.QuizCode,
            Visibility = q.Visibility,
            Duration = q.Duration,
            MaxAttempts = q.MaxAttempts,
            IsActive = q.IsActive,
            OwnerId = q.OwnerId,
            OwnerName = q.Owner.DisplayName,
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
            QuizCode = q.QuizCode,
            Visibility = q.Visibility,
            Duration = q.Duration,
            MaxAttempts = q.MaxAttempts,
            IsActive = q.IsActive,
            OwnerId = q.OwnerId,
            OwnerName = q.Owner.DisplayName,
            QuestionCount = q.QuizQuestions.Count,
            Questions = q.QuizQuestions.OrderBy(qq => qq.Order)
                .Select(qq => new QuizQuestionResponse
                {
                    QuestionId = qq.QuestionId,
                    QuestionVersionId = qq.QuestionVersionId,
                    VersionNumber = qq.QuestionVersion.VersionNumber,
                    LatestVersionNumber = qq.Question.Versions.Max(v => v.VersionNumber),
                    Order = qq.Order,
                    Content = qq.QuestionVersion.Content,
                    QuestionType = qq.QuestionVersion.QuestionType
                }).ToList()
        });
}

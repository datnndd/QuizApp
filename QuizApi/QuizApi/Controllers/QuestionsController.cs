using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Questions;
using QuizApi.Extensions;
using QuizApi.Models;

namespace QuizApi.Controllers;

[Authorize]
[ApiController]
[Route("api/questions")]
public class QuestionsController(AppDbContext context) : ControllerBase
{
    [HttpGet("explore")]
    public Task<List<QuestionSummaryResponse>> Explore(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] int? authorId,
        CancellationToken cancellationToken) =>
        QueryPublicQuestions(search, categoryId, authorId).ToListAsync(cancellationToken);

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<QuestionSummaryResponse>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var questions = await SummaryQuery(context.Questions.AsNoTracking()
                .Where(q => q.OwnerId == userId && q.IsActive))
            .OrderByDescending(q => q.Id)
            .ToListAsync(cancellationToken);

        return Ok(questions);
    }

    [HttpGet("author/{authorId:int}")]
    public async Task<ActionResult<IEnumerable<QuestionSummaryResponse>>> ByAuthor(
        int authorId,
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        CancellationToken cancellationToken)
    {
        var questions = await QueryPublicQuestions(search, categoryId, authorId)
            .ToListAsync(cancellationToken);
        return Ok(questions);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuestionDetailResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var canView = await context.Questions.AnyAsync(q =>
            q.Id == id &&
            (q.OwnerId == userId ||
             q.IsActive && q.QuizQuestions.Any(qq => qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public)),
            cancellationToken);

        if (!canView)
        {
            return NotFound(new { message = "Question not found." });
        }

        return Ok(await LoadDetail(id, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<QuestionDetailResponse>> Create(
        CreateQuestionRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateDefinition(request.QuestionType, request.Content, request.Answers);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        if (!await context.Categories.AnyAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken))
        {
            return BadRequest(new { message = "Category not found." });
        }

        var question = await CreateQuestion(
            User.GetUserId(), request.CategoryId, null, request.Content,
            request.QuestionType, request.Answers, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = question.Id }, await LoadDetail(question.Id, cancellationToken));
    }

    [HttpPost("{sourceQuestionId:int}/customize")]
    public async Task<ActionResult<QuestionDetailResponse>> Customize(
        int sourceQuestionId,
        CustomizeQuestionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var source = await context.Questions
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == sourceQuestionId && q.IsActive, cancellationToken);

        if (source is null || source.OwnerId != userId && !await IsPubliclyDiscoverable(sourceQuestionId, cancellationToken))
        {
            return NotFound(new { message = "Source question not found." });
        }

        var versionId = request.QuestionVersionId ?? source.CurrentVersionId;
        var version = await context.QuestionVersions
            .AsNoTracking()
            .Include(v => v.Answers)
            .FirstOrDefaultAsync(v => v.Id == versionId && v.QuestionId == sourceQuestionId, cancellationToken);

        if (version is null)
        {
            return BadRequest(new { message = "The selected version does not belong to the source question." });
        }

        var answers = version.Answers
            .Select(a => new AnswerDefinitionRequest { Content = a.Content, IsCorrect = a.IsCorrect })
            .ToList();
        var customized = await CreateQuestion(
            userId, source.CategoryId, source.Id, version.Content, version.QuestionType, answers, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = customized.Id }, await LoadDetail(customized.Id, cancellationToken));
    }

    [HttpPost("{id:int}/versions")]
    public async Task<ActionResult<QuestionVersionResponse>> CreateVersion(
        int id,
        CreateQuestionVersionRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateDefinition(request.QuestionType, request.Content, request.Answers);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var question = await context.Questions
            .FirstOrDefaultAsync(q => q.Id == id && q.IsActive, cancellationToken);
        if (question is null)
        {
            return NotFound(new { message = "Question not found." });
        }
        if (question.OwnerId != User.GetUserId())
        {
            return Forbid();
        }

        var nextNumber = await context.QuestionVersions
            .Where(v => v.QuestionId == id)
            .MaxAsync(v => v.VersionNumber, cancellationToken) + 1;

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var version = NewVersion(id, nextNumber, request.Content, request.QuestionType, request.Answers);
        context.QuestionVersions.Add(version);
        await context.SaveChangesAsync(cancellationToken);
        question.CurrentVersionId = version.Id;
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id }, ToVersionResponse(version, true));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var question = await context.Questions.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (question is null)
        {
            return NotFound(new { message = "Question not found." });
        }
        if (question.OwnerId != User.GetUserId())
        {
            return Forbid();
        }

        question.IsActive = false;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<QuestionSummaryResponse> QueryPublicQuestions(string? search, int? categoryId, int? authorId)
    {
        var query = context.Questions.AsNoTracking().Where(q =>
            q.IsActive && q.QuizQuestions.Any(qq => qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(q => q.CurrentVersion!.Content.Contains(term));
        }
        if (categoryId.HasValue)
        {
            query = query.Where(q => q.CategoryId == categoryId.Value);
        }
        if (authorId.HasValue)
        {
            query = query.Where(q => q.OwnerId == authorId.Value);
        }

        return SummaryQuery(query).OrderByDescending(q => q.PublicQuizCount).ThenBy(q => q.Content);
    }

    private static IQueryable<QuestionSummaryResponse> SummaryQuery(IQueryable<Question> query) =>
        query.Select(q => new QuestionSummaryResponse
        {
            Id = q.Id,
            CategoryId = q.CategoryId,
            CategoryName = q.Category.Name,
            OwnerId = q.OwnerId,
            AuthorName = q.Owner.DisplayName,
            CurrentVersionId = q.CurrentVersionId!.Value,
            VersionNumber = q.CurrentVersion!.VersionNumber,
            Content = q.CurrentVersion.Content,
            QuestionType = q.CurrentVersion.QuestionType,
            PublicQuizCount = q.QuizQuestions
                .Where(qq => qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public)
                .Select(qq => qq.QuizId)
                .Distinct()
                .Count()
        });

    private Task<bool> IsPubliclyDiscoverable(int questionId, CancellationToken cancellationToken) =>
        context.QuizQuestions.AnyAsync(qq =>
            qq.QuestionId == questionId && qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public,
            cancellationToken);

    private async Task<Question> CreateQuestion(
        int ownerId,
        int categoryId,
        int? sourceQuestionId,
        string content,
        QuestionType type,
        IReadOnlyCollection<AnswerDefinitionRequest> answers,
        CancellationToken cancellationToken)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var question = new Question
        {
            OwnerId = ownerId,
            CategoryId = categoryId,
            SourceQuestionId = sourceQuestionId
        };
        context.Questions.Add(question);
        await context.SaveChangesAsync(cancellationToken);

        var version = NewVersion(question.Id, 1, content, type, answers);
        context.QuestionVersions.Add(version);
        await context.SaveChangesAsync(cancellationToken);
        question.CurrentVersionId = version.Id;
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return question;
    }

    private static QuestionVersion NewVersion(
        int questionId,
        int versionNumber,
        string content,
        QuestionType type,
        IEnumerable<AnswerDefinitionRequest> answers) => new()
        {
            QuestionId = questionId,
            VersionNumber = versionNumber,
            Content = content.Trim(),
            QuestionType = type,
            Answers = answers.Select(a => new Answer { Content = a.Content.Trim(), IsCorrect = a.IsCorrect }).ToList()
        };

    private async Task<QuestionDetailResponse> LoadDetail(int id, CancellationToken cancellationToken) =>
        await context.Questions.AsNoTracking().AsSplitQuery()
            .Where(q => q.Id == id)
            .Select(q => new QuestionDetailResponse
            {
                Id = q.Id,
                CategoryId = q.CategoryId,
                CategoryName = q.Category.Name,
                OwnerId = q.OwnerId,
                AuthorName = q.Owner.DisplayName,
                CurrentVersionId = q.CurrentVersionId!.Value,
                VersionNumber = q.CurrentVersion!.VersionNumber,
                Content = q.CurrentVersion.Content,
                QuestionType = q.CurrentVersion.QuestionType,
                PublicQuizCount = q.QuizQuestions
                    .Where(qq => qq.Quiz.IsActive && qq.Quiz.Visibility == QuizVisibility.Public)
                    .Select(qq => qq.QuizId).Distinct().Count(),
                SourceQuestionId = q.SourceQuestionId,
                IsActive = q.IsActive,
                CreatedAt = q.CreatedAt,
                Versions = q.Versions.OrderByDescending(v => v.VersionNumber)
                    .Select(v => new QuestionVersionResponse
                    {
                        Id = v.Id,
                        VersionNumber = v.VersionNumber,
                        Content = v.Content,
                        QuestionType = v.QuestionType,
                        CreatedAt = v.CreatedAt,
                        IsCurrent = v.Id == q.CurrentVersionId,
                        Answers = v.Answers.OrderBy(a => a.Id)
                            .Select(a => new AnswerResponse
                            {
                                Id = a.Id,
                                Content = a.Content,
                                IsCorrect = a.IsCorrect
                            }).ToList()
                    }).ToList()
            })
            .SingleAsync(cancellationToken);

    private static QuestionVersionResponse ToVersionResponse(QuestionVersion version, bool isCurrent) => new()
    {
        Id = version.Id,
        VersionNumber = version.VersionNumber,
        Content = version.Content,
        QuestionType = version.QuestionType,
        CreatedAt = version.CreatedAt,
        IsCurrent = isCurrent,
        Answers = version.Answers.Select(a => new AnswerResponse
        {
            Id = a.Id,
            Content = a.Content,
            IsCorrect = a.IsCorrect
        }).ToList()
    };

    private static string? ValidateDefinition(
        QuestionType type,
        string content,
        IReadOnlyCollection<AnswerDefinitionRequest> answers)
    {
        if (string.IsNullOrWhiteSpace(content)) return "Question content is required.";
        if (answers.Count < 2) return "A question must have at least two answers.";
        if (answers.Any(a => string.IsNullOrWhiteSpace(a.Content))) return "Answer content is required.";

        var correctCount = answers.Count(a => a.IsCorrect);
        if (type == QuestionType.MultipleChoice && correctCount < 1)
            return "A multiple-choice question must have at least one correct answer.";
        if (type != QuestionType.MultipleChoice && correctCount != 1)
            return "Single-choice and true/false questions must have exactly one correct answer.";
        if (type == QuestionType.TrueFalse && answers.Count != 2)
            return "A true/false question must have exactly two answers.";

        return null;
    }
}

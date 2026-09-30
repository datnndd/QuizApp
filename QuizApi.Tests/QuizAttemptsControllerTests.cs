using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Controllers;
using QuizApi.Data;
using QuizApi.DTOs.Attempts;
using QuizApi.Models;
using QuizApi.Services;

namespace QuizApi.Tests;

public class QuizAttemptsControllerTests
{
    [Fact]
    public async Task Start_CopiesQuestionVersionsSoLaterQuizEditsDoNotChangeTheAttempt()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Public);
        var controller = Controller(context, userId: 2);

        var action = await controller.Start(
            new StartAttemptRequest { QuizId = 20 }, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(action.Result);
        var response = Assert.IsType<AttemptResponse>(created.Value);

        var quizQuestion = await context.QuizQuestions.SingleAsync(CancellationToken.None);
        quizQuestion.QuestionVersionId = 101;
        await context.SaveChangesAsync(CancellationToken.None);
        var snapshotVersionId = await context.QuizAttemptQuestions
            .Where(q => q.QuizAttemptId == response.Id)
            .Select(q => q.QuestionVersionId)
            .SingleAsync(CancellationToken.None);

        Assert.Equal(100, snapshotVersionId);
        Assert.Equal(100, response.Questions.Single().QuestionVersionId);
    }

    [Fact]
    public async Task Start_RejectsAnotherUsersPrivateQuiz()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Private);
        var controller = Controller(context, userId: 2);

        var action = await controller.Start(
            new StartAttemptRequest { QuizId = 20 }, CancellationToken.None);

        Assert.IsType<ForbidResult>(action.Result);
        Assert.Empty(context.QuizAttempts);
    }

    [Fact]
    public async Task Start_CountsAnInProgressAttemptAgainstTheLimit()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Public, maxAttempts: 1);
        context.QuizAttempts.Add(new QuizAttempt
        {
            QuizId = 20,
            UserId = 2,
            StartedAt = DateTime.UtcNow,
            Status = QuizAttemptStatus.InProgress
        });
        await context.SaveChangesAsync(CancellationToken.None);
        var controller = Controller(context, userId: 2);

        var action = await controller.Start(
            new StartAttemptRequest { QuizId = 20 }, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(action.Result);
        Assert.Single(context.QuizAttempts);
    }

    [Fact]
    public async Task Resume_WhenExpired_ReturnsNotFoundAndAutoSubmits()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Public);
        var startedAt = new DateTime(2026, 9, 22, 9, 0, 0, DateTimeKind.Utc);
        context.QuizAttempts.Add(new QuizAttempt
        {
            Id = 55,
            QuizId = 20,
            UserId = 2,
            StartedAt = startedAt,
            ExpiresAt = startedAt.AddMinutes(15),
            Status = QuizAttemptStatus.InProgress,
            TotalQuestions = 1,
            Questions =
            [
                new QuizAttemptQuestion
                {
                    QuestionId = 10,
                    QuestionVersionId = 100,
                    Order = 1
                }
            ]
        });
        await context.SaveChangesAsync(CancellationToken.None);
        var controller = Controller(context, userId: 2);

        var action = await controller.Resume(20, CancellationToken.None);
        Assert.IsType<NotFoundObjectResult>(action.Result);

        var attemptInDb = await context.QuizAttempts.SingleAsync(a => a.Id == 55);
        Assert.Equal(QuizAttemptStatus.Submitted, attemptInDb.Status);
        Assert.True(attemptInDb.IsAutoSubmitted);
    }

    [Fact]
    public async Task Start_RejectsSoftDeletedQuiz()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Public);
        var quiz = await context.Quizzes.SingleAsync(q => q.Id == 20);
        quiz.IsDeleted = true;
        quiz.DeletedAt = DateTime.UtcNow;
        quiz.IsActive = false;
        await context.SaveChangesAsync(CancellationToken.None);

        var controller = Controller(context, userId: 2);
        var action = await controller.Start(new StartAttemptRequest { QuizId = 20 }, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(action.Result);
    }

    [Fact]
    public async Task Mine_ReturnsPastAttemptsWithIsQuizDeletedFlag()
    {
        await using var context = CreateContext();
        await SeedQuiz(context, QuizVisibility.Public);
        var quiz = await context.Quizzes.SingleAsync(q => q.Id == 20);

        context.QuizAttempts.Add(new QuizAttempt
        {
            Id = 88,
            QuizId = 20,
            UserId = 2,
            StartedAt = DateTime.UtcNow.AddHours(-1),
            SubmittedAt = DateTime.UtcNow.AddMinutes(-45),
            Status = QuizAttemptStatus.Submitted,
            TotalQuestions = 1,
            CorrectAnswers = 1,
            Score = 100
        });
        await context.SaveChangesAsync(CancellationToken.None);

        // Soft delete the quiz
        quiz.IsDeleted = true;
        quiz.DeletedAt = DateTime.UtcNow;
        quiz.IsActive = false;
        await context.SaveChangesAsync(CancellationToken.None);

        var controller = Controller(context, userId: 2);
        var action = await controller.Mine(CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var attempts = Assert.IsAssignableFrom<IEnumerable<UserAttemptSummaryResponse>>(ok.Value);
        var attempt = Assert.Single(attempts);

        Assert.Equal(88, attempt.Id);
        Assert.True(attempt.IsQuizDeleted);
        Assert.False(attempt.IsQuizActive);
    }

    private static QuizAttemptsController Controller(AppDbContext context, int userId)
    {
        var timeProvider = new FixedTimeProvider(new DateTime(2026, 9, 22, 10, 0, 0, DateTimeKind.Utc));
        var controller = new QuizAttemptsController(context, new QuizAttemptService(context, timeProvider), timeProvider)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"))
                }
            }
        };
        return controller;
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private static async Task SeedQuiz(AppDbContext context, QuizVisibility visibility, int maxAttempts = 0)
    {
        var owner = TestData.User(1);
        var participant = TestData.User(2);
        var question = new Question
        {
            Id = 10,
            OwnerId = owner.Id,
            CategoryId = 1,
            CurrentVersionId = 101,
            Versions =
            [
                new QuestionVersion
                {
                    Id = 100,
                    VersionNumber = 1,
                    Content = "Old content",
                    QuestionType = QuestionType.SingleChoice,
                    Answers =
                    [
                        new Answer { Id = 1000, Content = "A", IsCorrect = true },
                        new Answer { Id = 1001, Content = "B", IsCorrect = false }
                    ]
                },
                new QuestionVersion
                {
                    Id = 101,
                    VersionNumber = 2,
                    Content = "New content",
                    QuestionType = QuestionType.SingleChoice,
                    Answers =
                    [
                        new Answer { Id = 1002, Content = "A", IsCorrect = false },
                        new Answer { Id = 1003, Content = "B", IsCorrect = true }
                    ]
                }
            ]
        };
        var quiz = new Quiz
        {
            Id = 20,
            OwnerId = owner.Id,
            CategoryId = 1,
            Title = "Snapshot quiz",
            Visibility = visibility,
            MaxAttempts = maxAttempts,
            QuizQuestions =
            [
                new QuizQuestion
                {
                    QuestionId = question.Id,
                    QuestionVersionId = 100,
                    Order = 1
                }
            ]
        };

        context.AddRange(owner, participant, question, quiz);
        await context.SaveChangesAsync(CancellationToken.None);
    }
}

internal static class TestData
{
    public static User User(int id) => new()
    {
        Id = id,
        FirstName = $"User{id}",
        LastName = "Test",
        DisplayName = $"User {id}",
        Email = $"user{id}@example.com",
        UserName = $"user{id}",
        PasswordHash = "not-used"
    };
}

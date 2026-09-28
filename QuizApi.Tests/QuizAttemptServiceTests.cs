using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.Models;
using QuizApi.Services;

namespace QuizApi.Tests;

public class QuizAttemptServiceTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(true, true)]
    public async Task Submit_GradesMultipleChoiceAsAnExactSet(bool selectEveryCorrectAnswer, bool expectedCorrect)
    {
        await using var context = CreateContext();
        await SeedAttempt(context, expiresAt: null, selectEveryCorrectAnswer);
        var service = new QuizAttemptService(context, new FixedTimeProvider(new DateTime(2026, 9, 22, 10, 10, 0, DateTimeKind.Utc)));

        var result = await service.Submit(30, false, CancellationToken.None);

        Assert.Equal(expectedCorrect ? 1 : 0, result.Score);
        Assert.Equal(expectedCorrect, result.Questions.Single().IsCorrect);
    }

    [Fact]
    public async Task SubmitIfExpired_UsesTheOriginalExpirationAndAutoSubmits()
    {
        await using var context = CreateContext();
        var startedAt = new DateTime(2026, 9, 22, 10, 0, 0, DateTimeKind.Utc);
        await SeedAttempt(context, startedAt.AddMinutes(30), selectEveryCorrectAnswer: true, startedAt);
        var service = new QuizAttemptService(context, new FixedTimeProvider(startedAt.AddHours(1)));

        var submitted = await service.SubmitIfExpired(30, CancellationToken.None);
        var result = await service.GetResult(30, CancellationToken.None);

        Assert.True(submitted);
        Assert.NotNull(result);
        Assert.True(result.IsAutoSubmitted);
        Assert.Equal(30 * 60, result.TimeSpentSeconds);
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

    private static async Task SeedAttempt(
        AppDbContext context,
        DateTime? expiresAt,
        bool selectEveryCorrectAnswer,
        DateTime? startedAt = null)
    {
        var user = TestData.User(1);
        var version = new QuestionVersion
        {
            Id = 100,
            QuestionId = 10,
            VersionNumber = 1,
            Content = "Select the prime numbers",
            QuestionType = QuestionType.MultipleChoice,
            Answers =
            [
                new Answer { Id = 1000, Content = "2", IsCorrect = true },
                new Answer { Id = 1001, Content = "3", IsCorrect = true },
                new Answer { Id = 1002, Content = "4", IsCorrect = false }
            ]
        };
        var question = new Question
        {
            Id = 10,
            OwnerId = user.Id,
            CategoryId = 1,
            CurrentVersionId = version.Id,
            Versions = [version]
        };
        var quiz = new Quiz
        {
            Id = 20,
            OwnerId = user.Id,
            CategoryId = 1,
            Title = "Math",
            Visibility = QuizVisibility.Public
        };
        var attemptQuestion = new QuizAttemptQuestion
        {
            Id = 40,
            QuestionId = question.Id,
            QuestionVersionId = version.Id,
            Order = 1,
            UserAnswers =
            [
                new UserAnswer { Id = 50, AnswerId = 1000 },
                .. (selectEveryCorrectAnswer ? [new UserAnswer { Id = 51, AnswerId = 1001 }] : Array.Empty<UserAnswer>())
            ]
        };
        var attempt = new QuizAttempt
        {
            Id = 30,
            QuizId = quiz.Id,
            UserId = user.Id,
            StartedAt = startedAt ?? new DateTime(2026, 9, 22, 10, 0, 0, DateTimeKind.Utc),
            ExpiresAt = expiresAt,
            Status = QuizAttemptStatus.InProgress,
            TotalQuestions = 1,
            Questions = [attemptQuestion]
        };

        context.AddRange(user, question, quiz, attempt);
        await context.SaveChangesAsync(CancellationToken.None);
    }
}

internal sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
}

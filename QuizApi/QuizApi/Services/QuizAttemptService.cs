using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Attempts;
using QuizApi.Models;

namespace QuizApi.Services;

public class QuizAttemptService(AppDbContext context, TimeProvider timeProvider)
{
    public async Task<bool> SubmitIfExpired(int attemptId, CancellationToken cancellationToken)
    {
        var attempt = await context.QuizAttempts
            .AsNoTracking()
            .Where(a => a.Id == attemptId)
            .Select(a => new { a.Status, a.ExpiresAt })
            .SingleOrDefaultAsync(cancellationToken);

        if (attempt is null || attempt.Status != QuizAttemptStatus.InProgress ||
            attempt.ExpiresAt is null || attempt.ExpiresAt > timeProvider.GetUtcNow().UtcDateTime)
            return false;

        await Submit(attemptId, true, cancellationToken);
        return true;
    }

    public async Task<AttemptResultResponse> Submit(
        int attemptId,
        bool isAutoSubmitted,
        CancellationToken cancellationToken)
    {
        var attempt = await context.QuizAttempts
            .AsSplitQuery()
            .Include(a => a.Questions)
                .ThenInclude(q => q.QuestionVersion)
                    .ThenInclude(v => v.Answers)
            .Include(a => a.Questions)
                .ThenInclude(q => q.UserAnswers)
            .SingleAsync(a => a.Id == attemptId, cancellationToken);

        if (attempt.Status == QuizAttemptStatus.InProgress)
        {
            foreach (var question in attempt.Questions)
            {
                var correct = question.QuestionVersion.Answers
                    .Where(a => a.IsCorrect)
                    .Select(a => a.Id)
                    .ToHashSet();
                var selected = question.UserAnswers.Select(a => a.AnswerId).ToHashSet();
                question.IsCorrect = correct.SetEquals(selected);
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var submittedAt = isAutoSubmitted && attempt.ExpiresAt is not null && attempt.ExpiresAt < now
                ? attempt.ExpiresAt.Value
                : now;
            attempt.Status = QuizAttemptStatus.Submitted;
            attempt.SubmittedAt = submittedAt;
            attempt.TimeSpentSeconds = (int)Math.Max(0, (submittedAt - attempt.StartedAt).TotalSeconds);
            attempt.CorrectAnswers = attempt.Questions.Count(q => q.IsCorrect == true);
            attempt.Score = attempt.CorrectAnswers;
            attempt.IsAutoSubmitted = isAutoSubmitted;
            await context.SaveChangesAsync(cancellationToken);
        }

        return ToResult(attempt);
    }

    public async Task<AttemptResultResponse?> GetResult(int attemptId, CancellationToken cancellationToken)
    {
        var attempt = await context.QuizAttempts
            .AsNoTracking()
            .AsSplitQuery()
            .Include(a => a.Questions)
                .ThenInclude(q => q.QuestionVersion)
                    .ThenInclude(v => v.Answers)
            .Include(a => a.Questions)
                .ThenInclude(q => q.UserAnswers)
            .SingleOrDefaultAsync(a => a.Id == attemptId, cancellationToken);

        return attempt?.Status == QuizAttemptStatus.Submitted ? ToResult(attempt) : null;
    }

    private static AttemptResultResponse ToResult(QuizAttempt attempt) => new()
    {
        AttemptId = attempt.Id,
        Score = attempt.Score ?? 0,
        TotalQuestions = attempt.TotalQuestions,
        CorrectAnswers = attempt.CorrectAnswers ?? 0,
        TimeSpentSeconds = attempt.TimeSpentSeconds ?? 0,
        IsAutoSubmitted = attempt.IsAutoSubmitted,
        Questions = attempt.Questions.OrderBy(q => q.Order)
            .Select(q => new AttemptQuestionResultResponse
            {
                QuestionId = q.QuestionId,
                QuestionVersionId = q.QuestionVersionId,
                Order = q.Order,
                Content = q.QuestionVersion.Content,
                IsCorrect = q.IsCorrect == true,
                Answers = q.QuestionVersion.Answers.OrderBy(a => a.Id)
                    .Select(a => new ResultAnswerResponse
                    {
                        Id = a.Id,
                        Content = a.Content,
                        IsCorrect = a.IsCorrect,
                        IsSelected = q.UserAnswers.Any(ua => ua.AnswerId == a.Id)
                    }).ToList()
            }).ToList()
    };
}

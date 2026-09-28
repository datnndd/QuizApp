using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.Models;

namespace QuizApi.Services;

public class ExpiredAttemptSubmissionService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<ExpiredAttemptSubmissionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5), timeProvider);
        do
        {
            try
            {
                await SubmitExpiredAttempts(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to submit expired quiz attempts.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SubmitExpiredAttempts(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<QuizAttemptService>();
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var expiredIds = await context.QuizAttempts
            .Where(a => a.Status == QuizAttemptStatus.InProgress && a.ExpiresAt != null && a.ExpiresAt <= now)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        foreach (var attemptId in expiredIds)
            await service.SubmitIfExpired(attemptId, cancellationToken);
    }
}

namespace QuizApi.Models;

public class QuizAttempt
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public int UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public int? TimeSpentSeconds { get; set; }
    public int? Score { get; set; }
    public int TotalQuestions { get; set; }
    public int? CorrectAnswers { get; set; }
    public bool IsAutoSubmitted { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<QuizAttemptQuestion> Questions { get; set; } = new List<QuizAttemptQuestion>();
}

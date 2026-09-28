namespace QuizApi.Models;

public class QuizAttemptQuestion
{
    public int Id { get; set; }
    public int QuizAttemptId { get; set; }
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int Order { get; set; }
    public bool? IsCorrect { get; set; }

    public QuizAttempt QuizAttempt { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public QuestionVersion QuestionVersion { get; set; } = null!;
    public ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}

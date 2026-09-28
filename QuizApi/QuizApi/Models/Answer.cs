namespace QuizApi.Models;

public class Answer
{
    public int Id { get; set; }
    public int QuestionVersionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }

    public QuestionVersion QuestionVersion { get; set; } = null!;
    public ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}

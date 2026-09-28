namespace QuizApi.Models;

public class QuestionVersion
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Question Question { get; set; } = null!;
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
    public ICollection<QuizAttemptQuestion> AttemptQuestions { get; set; } = new List<QuizAttemptQuestion>();
}

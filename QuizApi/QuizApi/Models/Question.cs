namespace QuizApi.Models;

public class Question
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public int CategoryId { get; set; }
    public int? SourceQuestionId { get; set; }
    public int? CurrentVersionId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Owner { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public Question? SourceQuestion { get; set; }
    public QuestionVersion? CurrentVersion { get; set; }
    public ICollection<QuestionVersion> Versions { get; set; } = new List<QuestionVersion>();
    public ICollection<Question> CustomizedQuestions { get; set; } = new List<Question>();
    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
}

namespace QuizApi.Models;

public class QuizQuestion
{
    public int QuizId { get; set; }
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int Order { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public QuestionVersion QuestionVersion { get; set; } = null!;
}

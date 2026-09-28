namespace QuizApi.Models;

public class UserAnswer
{
    public int Id { get; set; }
    public int QuizAttemptQuestionId { get; set; }
    public int AnswerId { get; set; }

    public QuizAttemptQuestion QuizAttemptQuestion { get; set; } = null!;
    public Answer Answer { get; set; } = null!;
}

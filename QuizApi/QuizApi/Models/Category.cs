namespace QuizApi.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}

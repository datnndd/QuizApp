namespace QuizApi.Models
{
    public class Question
    {
        public int Id { get; set; }

        public string Content { get; set; } = string.Empty;

        public string QuestionType { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;


        public ICollection<Answer> Answers { get; set; }
            = new List<Answer>();

        public ICollection<QuizQuestion> QuizQuestions { get; set; }
            = new List<QuizQuestion>();

        public ICollection<UserAnswer> UserAnswers { get; set; }
            = new List<UserAnswer>();
    }
}

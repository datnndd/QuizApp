namespace QuizApi.Models
{
    public class Quiz
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int Duration { get; set; }

        public bool IsActive { get; set; } = true;


        public int UserId { get; set; }

        public User? User { get; set; }


        public ICollection<QuizQuestion> QuizQuestions { get; set; }
            = new List<QuizQuestion>();

        public ICollection<QuizAttempt> QuizAttempts { get; set; }
            = new List<QuizAttempt>();
    }
}

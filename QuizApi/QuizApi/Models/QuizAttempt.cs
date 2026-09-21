namespace QuizApi.Models
{
    public class QuizAttempt
    {
        public int Id { get; set; }

        public string QuizCode { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }

        public DateTime? SubmittedTime { get; set; }


        public int QuizId { get; set; }

        public int UserId { get; set; }


        public Quiz Quiz { get; set; } = null!;

        public User User { get; set; } = null!;


        public ICollection<UserAnswer> UserAnswers { get; set; }
            = new List<UserAnswer>();
    }
}

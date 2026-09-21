namespace QuizApi.Models
{
    public class QuizQuestion
    {
        public int QuizId { get; set; }

        public int QuestionId { get; set; }


        public Quiz? Quiz { get; set; }

        public Question? Question { get; set; }
    }
}

namespace QuizApi.DTOs.Quizzes
{
    public class QuizResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int Duration { get; set; }

        public bool IsActive { get; set; }

        public int UserId { get; set; }

        public string OwnerName { get; set; } = string.Empty;

    }
}

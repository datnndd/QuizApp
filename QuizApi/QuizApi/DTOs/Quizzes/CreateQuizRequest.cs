using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Quizzes
{
    public class CreateQuizRequest
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(1, 1000)]
        public int Duration { get; set; }

        [Range(1, int.MaxValue)]
        public int UserId { get; set; }
    }
}

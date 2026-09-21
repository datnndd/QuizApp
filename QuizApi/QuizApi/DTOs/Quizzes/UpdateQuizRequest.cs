using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Quizzes
{
    public class UpdateQuizRequest
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(1, 1000)]
        public int Duration { get; set; }

        public bool IsActive { get; set; }
    }
}

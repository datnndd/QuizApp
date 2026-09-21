using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Auth
{
    public class LoginRequest
    {
        [Required]
        public string Identifier { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}

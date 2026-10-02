using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Auth
{
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}

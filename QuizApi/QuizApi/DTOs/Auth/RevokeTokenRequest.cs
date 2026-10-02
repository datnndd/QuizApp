using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Auth
{
    public class RevokeTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}

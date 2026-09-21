namespace QuizApi.DTOs.Auth
{
    public class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;

        public string TokenType { get; set; } = "Bearer";

        public int ExpiresIn { get; set; }

        public UserInfoResponse User { get; set; } = null!;
    }
}

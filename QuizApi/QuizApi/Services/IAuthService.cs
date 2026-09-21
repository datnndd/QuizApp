using QuizApi.DTOs.Auth;

namespace QuizApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<UserInfoResponse?> GetUserInfoAsync(int userId);
    }
}

using QuizApi.DTOs.Auth;

namespace QuizApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
        Task RevokeTokenAsync(string refreshToken);
        Task<UserInfoResponse?> GetUserInfoAsync(int userId);
        Task<UserInfoResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    }
}

using QuizApi.Models;

namespace QuizApi.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user, IEnumerable<string> roles, out int expiresInSeconds);
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using QuizApi.Models;

namespace QuizApi.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, IEnumerable<string> roles, out int expiresInSeconds)
        {
            var keyString = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key is not configured.");
            var issuer = _configuration["Jwt:Issuer"] ?? "QuizApi";
            var audience = _configuration["Jwt:Audience"] ?? "QuizFE";
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var mins) ? mins : 120;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim("displayName", user.DisplayName)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var expires = DateTime.UtcNow.AddMinutes(expiryMinutes);
            expiresInSeconds = expiryMinutes * 60;

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expires,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}

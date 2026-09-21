using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Auth;
using QuizApi.Models;

namespace QuizApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthService(AppDbContext context, IJwtService _jwtService)
        {
            _context = context;
            this._jwtService = _jwtService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var emailLower = request.Email.Trim().ToLowerInvariant();
            var usernameLower = request.UserName.Trim().ToLowerInvariant();

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == emailLower);
            if (emailExists)
            {
                throw new InvalidOperationException("Email is already registered.");
            }

            var usernameExists = await _context.Users.AnyAsync(u => u.UserName.ToLower() == usernameLower);
            if (usernameExists)
            {
                throw new InvalidOperationException("Username is already taken.");
            }

            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole == null)
            {
                userRole = new Role
                {
                    Name = "User",
                    Description = "Standard student/learner user",
                    IsActive = true
                };
                _context.Roles.Add(userRole);
                await _context.SaveChangesAsync();
            }

            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                DisplayName = $"{request.FirstName.Trim()} {request.LastName.Trim()}",
                Email = emailLower,
                UserName = usernameLower,
                PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = userRole.Id
            });
            await _context.SaveChangesAsync();

            var roles = new List<string> { userRole.Name };
            var token = _jwtService.GenerateToken(user, roles, out var expiresIn);

            return new AuthResponse
            {
                AccessToken = token,
                TokenType = "Bearer",
                ExpiresIn = expiresIn,
                User = new UserInfoResponse
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    UserName = user.UserName,
                    PhoneNumber = user.PhoneNumber,
                    Avatar = user.Avatar,
                    Roles = roles
                }
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var identifier = request.Identifier.Trim().ToLowerInvariant();

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.UserName.ToLower() == identifier);

            if (user == null || !user.IsActive || user.IsDeleted)
            {
                throw new UnauthorizedAccessException("Invalid email/username or password.");
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException("Invalid email/username or password.");
            }

            var roles = user.UserRoles
                .Where(ur => ur.Role != null && ur.Role.IsActive)
                .Select(ur => ur.Role!.Name)
                .Distinct()
                .ToList();

            if (!roles.Any())
            {
                roles.Add("User");
            }

            var token = _jwtService.GenerateToken(user, roles, out var expiresIn);

            return new AuthResponse
            {
                AccessToken = token,
                TokenType = "Bearer",
                ExpiresIn = expiresIn,
                User = new UserInfoResponse
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    UserName = user.UserName,
                    PhoneNumber = user.PhoneNumber,
                    Avatar = user.Avatar,
                    Roles = roles
                }
            };
        }

        public async Task<UserInfoResponse?> GetUserInfoAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return null;
            }

            var roles = user.UserRoles
                .Where(ur => ur.Role != null && ur.Role.IsActive)
                .Select(ur => ur.Role!.Name)
                .Distinct()
                .ToList();

            return new UserInfoResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                DisplayName = user.DisplayName,
                Email = user.Email,
                UserName = user.UserName,
                PhoneNumber = user.PhoneNumber,
                Avatar = user.Avatar,
                Roles = roles
            };
        }
    }
}

using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Auth;
using QuizApi.Models;
using QuizApi.Services;

namespace QuizApi.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_WhenAccountIsDisabled_ThrowsUnauthorizedWithClearMessage()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var disabledUser = new User
        {
            Id = 50,
            UserName = "disabledstudent",
            Email = "disabled@example.com",
            FirstName = "Disabled",
            LastName = "Student",
            DisplayName = "Disabled Student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Secret123!"),
            IsActive = false,
            IsDeleted = false
        };
        context.Users.Add(disabledUser);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.LoginAsync(new LoginRequest
            {
                Identifier = "disabled@example.com",
                Password = "Secret123!"
            }));

        Assert.Equal("This account has been disabled. Please contact the system administrator.", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_WhenActiveUser_SucceedsAndIssuesRefreshToken()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var activeUser = new User
        {
            Id = 51,
            UserName = "activestudent",
            Email = "active@example.com",
            FirstName = "Active",
            LastName = "Student",
            DisplayName = "Active Student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Secret123!"),
            IsActive = true,
            IsDeleted = false
        };
        context.Users.Add(activeUser);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        var response = await authService.LoginAsync(new LoginRequest
        {
            Identifier = "active@example.com",
            Password = "Secret123!"
        });

        Assert.NotNull(response);
        Assert.Equal("dummy_token", response.AccessToken);
        Assert.NotEmpty(response.RefreshToken);
        Assert.Equal("Active Student", response.User.DisplayName);

        var storedToken = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == response.RefreshToken);
        Assert.NotNull(storedToken);
        Assert.Equal(51, storedToken.UserId);
        Assert.True(storedToken.IsActive);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_RotatesTokenAndRevokesPrevious()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var user = new User
        {
            Id = 52,
            UserName = "rotatestudent",
            Email = "rotate@example.com",
            FirstName = "Rotate",
            LastName = "User",
            DisplayName = "Rotate User",
            PasswordHash = "hash",
            IsActive = true
        };
        context.Users.Add(user);

        var oldRefreshToken = new RefreshToken
        {
            Id = 1,
            UserId = 52,
            Token = "valid_initial_refresh_token",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        context.RefreshTokens.Add(oldRefreshToken);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        var response = await authService.RefreshTokenAsync("valid_initial_refresh_token");

        Assert.NotNull(response);
        Assert.Equal("dummy_token", response.AccessToken);
        Assert.NotEqual("valid_initial_refresh_token", response.RefreshToken);

        var updatedOldToken = await context.RefreshTokens.FindAsync(1);
        Assert.NotNull(updatedOldToken?.RevokedAt);
        Assert.Equal(response.RefreshToken, updatedOldToken?.ReplacedByToken);

        var newToken = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == response.RefreshToken);
        Assert.NotNull(newToken);
        Assert.Equal(52, newToken.UserId);
        Assert.True(newToken.IsActive);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithRevokedOrExpiredToken_ThrowsUnauthorized()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var user = new User
        {
            Id = 53,
            UserName = "expireduser",
            Email = "expired@example.com",
            FirstName = "Expired",
            LastName = "User",
            DisplayName = "Expired User",
            PasswordHash = "hash",
            IsActive = true
        };
        context.Users.Add(user);

        context.RefreshTokens.Add(new RefreshToken
        {
            UserId = 53,
            Token = "expired_token",
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3)
        });

        context.RefreshTokens.Add(new RefreshToken
        {
            UserId = 53,
            Token = "revoked_token",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            ExpiresAt = DateTime.UtcNow.AddDays(6),
            RevokedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.RefreshTokenAsync("expired_token"));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.RefreshTokenAsync("revoked_token"));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.RefreshTokenAsync("non_existent_token"));
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenUserDisabled_ThrowsUnauthorized()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var disabledUser = new User
        {
            Id = 54,
            UserName = "disabledtokenuser",
            Email = "disabledtoken@example.com",
            FirstName = "Disabled",
            LastName = "User",
            DisplayName = "Disabled User",
            PasswordHash = "hash",
            IsActive = false
        };
        context.Users.Add(disabledUser);

        context.RefreshTokens.Add(new RefreshToken
        {
            UserId = 54,
            Token = "active_token_for_disabled_user",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.RefreshTokenAsync("active_token_for_disabled_user"));

        Assert.Equal("This account has been disabled. Please contact the system administrator.", ex.Message);
    }

    [Fact]
    public async Task RevokeTokenAsync_RevokesActiveToken()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var token = new RefreshToken
        {
            Id = 10,
            UserId = 55,
            Token = "token_to_revoke",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, new DummyJwtService());

        await authService.RevokeTokenAsync("token_to_revoke");

        var revokedToken = await context.RefreshTokens.FindAsync(10);
        Assert.NotNull(revokedToken?.RevokedAt);
        Assert.False(revokedToken?.IsActive);
    }

    private class DummyJwtService : IJwtService
    {
        private int _counter = 0;

        public string GenerateToken(User user, IEnumerable<string> roles, out int expiresInSeconds)
        {
            expiresInSeconds = 900;
            return "dummy_token";
        }

        public RefreshToken GenerateRefreshToken(int userId)
        {
            _counter++;
            return new RefreshToken
            {
                UserId = userId,
                Token = $"mock_refresh_token_{_counter}_{Guid.NewGuid():N}",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }
    }
}

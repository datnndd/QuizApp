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
    public async Task LoginAsync_WhenActiveUser_Succeeds()
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
        Assert.Equal("Active Student", response.User.DisplayName);
    }

    private class DummyJwtService : IJwtService
    {
        public string GenerateToken(User user, IEnumerable<string> roles, out int expiresInSeconds)
        {
            expiresInSeconds = 3600;
            return "dummy_token";
        }
    }
}

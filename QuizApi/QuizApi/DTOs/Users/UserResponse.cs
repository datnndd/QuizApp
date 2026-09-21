namespace QuizApi.DTOs.Users
{
    public class UserResponse
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? Avatar { get; set; }

        public bool IsActive { get; set; }

        public bool IsDeleted { get; set; }

        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public string Role { get; set; } = "User";

        public List<string> Roles { get; set; } = new();
    }
}

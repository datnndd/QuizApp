namespace QuizApi.Models
{
    public class User
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

        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<UserRole> UserRoles { get; set; }
            = new List<UserRole>();

        public ICollection<Quiz> Quizzes { get; set; }
            = new List<Quiz>();

        public ICollection<QuizAttempt> QuizAttempts { get; set; }
            = new List<QuizAttempt>();
    }
}

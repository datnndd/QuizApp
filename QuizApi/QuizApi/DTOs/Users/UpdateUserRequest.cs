using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Users
{
    public class UpdateUserRequest
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? DisplayName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? Avatar { get; set; }

        [RegularExpression("^(Admin|User)$", ErrorMessage = "Role must be either 'Admin' or 'User'.")]
        public string? Role { get; set; }

        public bool IsActive { get; set; } = true;

        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string? Password { get; set; }
    }
}

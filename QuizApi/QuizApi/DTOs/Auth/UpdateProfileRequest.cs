using System.ComponentModel.DataAnnotations;

namespace QuizApi.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "First name is required.")]
        [MaxLength(100, ErrorMessage = "First name cannot exceed 100 characters.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required.")]
        [MaxLength(100, ErrorMessage = "Last name cannot exceed 100 characters.")]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Display name cannot exceed 200 characters.")]
        public string? DisplayName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30, ErrorMessage = "Phone number cannot exceed 30 characters.")]
        public string? PhoneNumber { get; set; }

        public string? CurrentPassword { get; set; }

        [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
        public string? NewPassword { get; set; }
    }
}

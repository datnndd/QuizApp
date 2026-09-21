namespace QuizApi.DTOs.Users
{
    public class UserQueryParameters
    {
        public string? Search { get; set; }

        public string? Role { get; set; }

        public string? Status { get; set; } // "all", "active", "inactive", "deleted"

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public string? SortBy { get; set; } = "id";

        public string? SortDirection { get; set; } = "desc";
    }
}

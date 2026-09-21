namespace QuizApi.DTOs.Users
{
    public class UserStatisticsResponse
    {
        public int TotalUsers { get; set; }

        public int ActiveUsers { get; set; }

        public int InactiveUsers { get; set; }

        public int DeletedUsers { get; set; }

        public int AdminUsers { get; set; }

        public int StandardUsers { get; set; }

        public double ActiveRate => TotalUsers > 0 ? Math.Round((double)ActiveUsers / TotalUsers * 100, 1) : 0;
    }
}

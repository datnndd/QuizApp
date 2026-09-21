using Microsoft.EntityFrameworkCore;
using QuizApi.Models;

namespace QuizApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();

        public DbSet<Role> Roles => Set<Role>();

        public DbSet<UserRole> UserRoles => Set<UserRole>();

        public DbSet<Quiz> Quizzes => Set<Quiz>();

        public DbSet<Question> Questions => Set<Question>();

        public DbSet<Answer> Answers => Set<Answer>();

        public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();

        public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

        public DbSet<UserAnswer> UserAnswers => Set<UserAnswer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ======================
            // USER
            // ======================

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.FirstName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.LastName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.DisplayName)
                    .HasMaxLength(200);

                entity.Property(x => x.Email)
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(x => x.UserName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.PasswordHash)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(x => x.IsDeleted)
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(x => x.Email)
                    .IsUnique();

                entity.HasIndex(x => x.UserName)
                    .IsUnique();
            });


            // ======================
            // ROLE
            // ======================

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.HasIndex(x => x.Name)
                    .IsUnique();
            });


            // ======================
            // USER_ROLE
            // ======================

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(x => new
                {
                    x.UserId,
                    x.RoleId
                });

                entity.HasOne(x => x.User)
                    .WithMany(x => x.UserRoles)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Role)
                    .WithMany(x => x.UserRoles)
                    .HasForeignKey(x => x.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // ======================
            // QUIZ
            // ======================

            modelBuilder.Entity<Quiz>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Title)
                    .HasMaxLength(255)
                    .IsRequired();

                entity.HasOne(x => x.User)
                    .WithMany(x => x.Quizzes)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // ======================
            // QUESTION
            // ======================

            modelBuilder.Entity<Question>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Content)
                    .IsRequired();

                entity.Property(x => x.QuestionType)
                    .HasMaxLength(50)
                    .IsRequired();
            });


            // ======================
            // ANSWER
            // ======================

            modelBuilder.Entity<Answer>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Content)
                    .IsRequired();

                entity.HasOne(x => x.Question)
                    .WithMany(x => x.Answers)
                    .HasForeignKey(x => x.QuestionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // ======================
            // QUIZ_QUESTION
            // ======================

            modelBuilder.Entity<QuizQuestion>(entity =>
            {
                entity.HasKey(x => new
                {
                    x.QuizId,
                    x.QuestionId
                });

                entity.HasOne(x => x.Quiz)
                    .WithMany(x => x.QuizQuestions)
                    .HasForeignKey(x => x.QuizId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Question)
                    .WithMany(x => x.QuizQuestions)
                    .HasForeignKey(x => x.QuestionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // ======================
            // QUIZ ATTEMPT
            // ======================

            modelBuilder.Entity<QuizAttempt>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.QuizCode)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.HasOne(x => x.Quiz)
                    .WithMany(x => x.QuizAttempts)
                    .HasForeignKey(x => x.QuizId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.QuizAttempts)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // ======================
            // USER ANSWER
            // ======================

            modelBuilder.Entity<UserAnswer>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasOne(x => x.QuizAttempt)
                    .WithMany(x => x.UserAnswers)
                    .HasForeignKey(x => x.QuizAttemptId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Answer)
                    .WithMany(x => x.UserAnswers)
                    .HasForeignKey(x => x.AnswerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Question)
                    .WithMany(x => x.UserAnswers)
                    .HasForeignKey(x => x.QuestionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}

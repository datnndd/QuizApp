using Microsoft.EntityFrameworkCore;
using QuizApi.Models;

namespace QuizApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionVersion> QuestionVersions => Set<QuestionVersion>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAttemptQuestion> QuizAttemptQuestions => Set<QuizAttemptQuestion>();
    public DbSet<UserAnswer> UserAnswers => Set<UserAnswer>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.Email).HasMaxLength(255).IsRequired();
            entity.Property(x => x.UserName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(x => x.IsDeleted).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.UserName).IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.HasOne(x => x.User).WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Role).WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasData(
                new Category { Id = 1, Name = "Mathematics", IsActive = true },
                new Category { Id = 2, Name = "Science", IsActive = true },
                new Category { Id = 3, Name = "AI", IsActive = true },
                new Category { Id = 4, Name = "Programming", IsActive = true },
                new Category { Id = 5, Name = "English", IsActive = true },
                new Category { Id = 6, Name = "History", IsActive = true });
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne(x => x.Owner).WithMany(x => x.Questions)
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany(x => x.Questions)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.SourceQuestion).WithMany(x => x.CustomizedQuestions)
                .HasForeignKey(x => x.SourceQuestionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CurrentVersion).WithMany()
                .HasForeignKey(x => x.CurrentVersionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuestionVersion>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.QuestionType).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasIndex(x => new { x.QuestionId, x.VersionNumber }).IsUnique();
            entity.HasOne(x => x.Question).WithMany(x => x.Versions)
                .HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_QuestionVersion_VersionNumber", "[VersionNumber] > 0"));
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).IsRequired();
            entity.HasOne(x => x.QuestionVersion).WithMany(x => x.Answers)
                .HasForeignKey(x => x.QuestionVersionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(x => x.IsDeleted).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne(x => x.Owner).WithMany(x => x.Quizzes)
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany(x => x.Quizzes)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Quiz_Duration", "[Duration] >= 0");
                t.HasCheckConstraint("CK_Quiz_MaxAttempts", "[MaxAttempts] >= 0");
            });
        });

        modelBuilder.Entity<QuizQuestion>(entity =>
        {
            entity.HasKey(x => new { x.QuizId, x.QuestionId });
            entity.HasIndex(x => new { x.QuizId, x.Order }).IsUnique();
            entity.HasOne(x => x.Quiz).WithMany(x => x.QuizQuestions)
                .HasForeignKey(x => x.QuizId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Question).WithMany(x => x.QuizQuestions)
                .HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.QuestionVersion).WithMany(x => x.QuizQuestions)
                .HasForeignKey(x => x.QuestionVersionId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_QuizQuestion_Order", "[Order] > 0"));
        });

        modelBuilder.Entity<QuizAttempt>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.QuizId, x.Status });
            entity.HasOne(x => x.Quiz).WithMany(x => x.QuizAttempts)
                .HasForeignKey(x => x.QuizId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.User).WithMany(x => x.QuizAttempts)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuizAttemptQuestion>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.QuizAttemptId, x.QuestionId }).IsUnique();
            entity.HasIndex(x => new { x.QuizAttemptId, x.Order }).IsUnique();
            entity.HasOne(x => x.QuizAttempt).WithMany(x => x.Questions)
                .HasForeignKey(x => x.QuizAttemptId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Question).WithMany()
                .HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.QuestionVersion).WithMany(x => x.AttemptQuestions)
                .HasForeignKey(x => x.QuestionVersionId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_QuizAttemptQuestion_Order", "[Order] > 0"));
        });

        modelBuilder.Entity<UserAnswer>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.QuizAttemptQuestionId, x.AnswerId }).IsUnique();
            entity.HasOne(x => x.QuizAttemptQuestion).WithMany(x => x.UserAnswers)
                .HasForeignKey(x => x.QuizAttemptQuestionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Answer).WithMany(x => x.UserAnswers)
                .HasForeignKey(x => x.AnswerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Token).HasMaxLength(256).IsRequired();
            entity.HasIndex(x => x.Token).IsUnique();
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User).WithMany(x => x.RefreshTokens)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}

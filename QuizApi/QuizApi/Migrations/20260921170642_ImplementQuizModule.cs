using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QuizApi.Migrations
{
    /// <inheritdoc />
    public partial class ImplementQuizModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (SELECT 1 FROM [Questions])
                   OR EXISTS (SELECT 1 FROM [Quizzes])
                   OR EXISTS (SELECT 1 FROM [QuizAttempts])
                   OR EXISTS (SELECT 1 FROM [Answers])
                   OR EXISTS (SELECT 1 FROM [QuizQuestions])
                   OR EXISTS (SELECT 1 FROM [UserAnswers])
                    THROW 51000, 'ImplementQuizModule requires empty legacy quiz tables because the old schema has no question ownership or version history to migrate safely.', 1;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Answers_Questions_QuestionId",
                table: "Answers");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Users_UserId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAnswers_Questions_QuestionId",
                table: "UserAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAnswers_QuizAttempts_QuizAttemptId",
                table: "UserAnswers");

            migrationBuilder.DropIndex(
                name: "IX_UserAnswers_QuestionId",
                table: "UserAnswers");

            migrationBuilder.DropIndex(
                name: "IX_UserAnswers_QuizAttemptId",
                table: "UserAnswers");

            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "QuestionId",
                table: "UserAnswers");

            migrationBuilder.DropColumn(
                name: "QuizCode",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Answers");

            migrationBuilder.RenameColumn(
                name: "QuizAttemptId",
                table: "UserAnswers",
                newName: "QuizAttemptQuestionId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Quizzes",
                newName: "OwnerId");

            migrationBuilder.RenameIndex(
                name: "IX_Quizzes_UserId",
                table: "Quizzes",
                newName: "IX_Quizzes_OwnerId");

            migrationBuilder.RenameColumn(
                name: "SubmittedTime",
                table: "QuizAttempts",
                newName: "SubmittedAt");

            migrationBuilder.RenameColumn(
                name: "StartTime",
                table: "QuizAttempts",
                newName: "StartedAt");

            migrationBuilder.RenameColumn(
                name: "QuestionId",
                table: "Answers",
                newName: "QuestionVersionId");

            migrationBuilder.RenameIndex(
                name: "IX_Answers_QuestionId",
                table: "Answers",
                newName: "IX_Answers_QuestionVersionId");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Quizzes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Quizzes",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<int>(
                name: "MaxAttempts",
                table: "Quizzes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "QuizCode",
                table: "Quizzes",
                type: "nvarchar(6)",
                maxLength: 6,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Visibility",
                table: "Quizzes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "QuizQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "QuestionVersionId",
                table: "QuizQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CorrectAnswers",
                table: "QuizAttempts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "QuizAttempts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutoSubmitted",
                table: "QuizAttempts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "QuizAttempts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "QuizAttempts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TimeSpentSeconds",
                table: "QuizAttempts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalQuestions",
                table: "QuizAttempts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Questions",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<int>(
                name: "CurrentVersionId",
                table: "Questions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SourceQuestionId",
                table: "Questions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuestionVersions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionVersions", x => x.Id);
                    table.CheckConstraint("CK_QuestionVersion_VersionNumber", "[VersionNumber] > 0");
                    table.ForeignKey(
                        name: "FK_QuestionVersions_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuizAttemptQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizAttemptId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    QuestionVersionId = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizAttemptQuestions", x => x.Id);
                    table.CheckConstraint("CK_QuizAttemptQuestion_Order", "[Order] > 0");
                    table.ForeignKey(
                        name: "FK_QuizAttemptQuestions_QuestionVersions_QuestionVersionId",
                        column: x => x.QuestionVersionId,
                        principalTable: "QuestionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizAttemptQuestions_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizAttemptQuestions_QuizAttempts_QuizAttemptId",
                        column: x => x.QuizAttemptId,
                        principalTable: "QuizAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, true, "Mathematics" },
                    { 2, true, "Science" },
                    { 3, true, "AI" },
                    { 4, true, "Programming" },
                    { 5, true, "English" },
                    { 6, true, "History" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_QuizAttemptQuestionId_AnswerId",
                table: "UserAnswers",
                columns: new[] { "QuizAttemptQuestionId", "AnswerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_CategoryId",
                table: "Quizzes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_QuizCode",
                table: "Quizzes",
                column: "QuizCode",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Quiz_Duration",
                table: "Quizzes",
                sql: "[Duration] >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Quiz_MaxAttempts",
                table: "Quizzes",
                sql: "[MaxAttempts] >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestions_QuestionVersionId",
                table: "QuizQuestions",
                column: "QuestionVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestions_QuizId_Order",
                table: "QuizQuestions",
                columns: new[] { "QuizId", "Order" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_QuizQuestion_Order",
                table: "QuizQuestions",
                sql: "[Order] > 0");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_QuizId_Status",
                table: "QuizAttempts",
                columns: new[] { "UserId", "QuizId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_CategoryId",
                table: "Questions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_CurrentVersionId",
                table: "Questions",
                column: "CurrentVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_OwnerId",
                table: "Questions",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_SourceQuestionId",
                table: "Questions",
                column: "SourceQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionVersions_QuestionId_VersionNumber",
                table: "QuestionVersions",
                columns: new[] { "QuestionId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttemptQuestions_QuestionId",
                table: "QuizAttemptQuestions",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttemptQuestions_QuestionVersionId",
                table: "QuizAttemptQuestions",
                column: "QuestionVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttemptQuestions_QuizAttemptId_Order",
                table: "QuizAttemptQuestions",
                columns: new[] { "QuizAttemptId", "Order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttemptQuestions_QuizAttemptId_QuestionId",
                table: "QuizAttemptQuestions",
                columns: new[] { "QuizAttemptId", "QuestionId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_QuestionVersions_QuestionVersionId",
                table: "Answers",
                column: "QuestionVersionId",
                principalTable: "QuestionVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Categories_CategoryId",
                table: "Questions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_QuestionVersions_CurrentVersionId",
                table: "Questions",
                column: "CurrentVersionId",
                principalTable: "QuestionVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Questions_SourceQuestionId",
                table: "Questions",
                column: "SourceQuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Users_OwnerId",
                table: "Questions",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizQuestions_QuestionVersions_QuestionVersionId",
                table: "QuizQuestions",
                column: "QuestionVersionId",
                principalTable: "QuestionVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Categories_CategoryId",
                table: "Quizzes",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Users_OwnerId",
                table: "Quizzes",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAnswers_QuizAttemptQuestions_QuizAttemptQuestionId",
                table: "UserAnswers",
                column: "QuizAttemptQuestionId",
                principalTable: "QuizAttemptQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Answers_QuestionVersions_QuestionVersionId",
                table: "Answers");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Categories_CategoryId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_QuestionVersions_CurrentVersionId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Questions_SourceQuestionId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Users_OwnerId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizQuestions_QuestionVersions_QuestionVersionId",
                table: "QuizQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Categories_CategoryId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Users_OwnerId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAnswers_QuizAttemptQuestions_QuizAttemptQuestionId",
                table: "UserAnswers");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "QuizAttemptQuestions");

            migrationBuilder.DropTable(
                name: "QuestionVersions");

            migrationBuilder.DropIndex(
                name: "IX_UserAnswers_QuizAttemptQuestionId_AnswerId",
                table: "UserAnswers");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_CategoryId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_QuizCode",
                table: "Quizzes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Quiz_Duration",
                table: "Quizzes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Quiz_MaxAttempts",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_QuizQuestions_QuestionVersionId",
                table: "QuizQuestions");

            migrationBuilder.DropIndex(
                name: "IX_QuizQuestions_QuizId_Order",
                table: "QuizQuestions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QuizQuestion_Order",
                table: "QuizQuestions");

            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId_QuizId_Status",
                table: "QuizAttempts");

            migrationBuilder.DropIndex(
                name: "IX_Questions_CategoryId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_CurrentVersionId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_OwnerId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_SourceQuestionId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "MaxAttempts",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "QuizCode",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "Visibility",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "QuestionVersionId",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "CorrectAnswers",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "IsAutoSubmitted",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "TimeSpentSeconds",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "TotalQuestions",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "CurrentVersionId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "SourceQuestionId",
                table: "Questions");

            migrationBuilder.RenameColumn(
                name: "QuizAttemptQuestionId",
                table: "UserAnswers",
                newName: "QuizAttemptId");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "Quizzes",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Quizzes_OwnerId",
                table: "Quizzes",
                newName: "IX_Quizzes_UserId");

            migrationBuilder.RenameColumn(
                name: "SubmittedAt",
                table: "QuizAttempts",
                newName: "SubmittedTime");

            migrationBuilder.RenameColumn(
                name: "StartedAt",
                table: "QuizAttempts",
                newName: "StartTime");

            migrationBuilder.RenameColumn(
                name: "QuestionVersionId",
                table: "Answers",
                newName: "QuestionId");

            migrationBuilder.RenameIndex(
                name: "IX_Answers_QuestionVersionId",
                table: "Answers",
                newName: "IX_Answers_QuestionId");

            migrationBuilder.AddColumn<int>(
                name: "QuestionId",
                table: "UserAnswers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "QuizCode",
                table: "QuizAttempts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                table: "Questions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Answers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_QuestionId",
                table: "UserAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_QuizAttemptId",
                table: "UserAnswers",
                column: "QuizAttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId",
                table: "QuizAttempts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_Questions_QuestionId",
                table: "Answers",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Users_UserId",
                table: "Quizzes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAnswers_Questions_QuestionId",
                table: "UserAnswers",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAnswers_QuizAttempts_QuizAttemptId",
                table: "UserAnswers",
                column: "QuizAttemptId",
                principalTable: "QuizAttempts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

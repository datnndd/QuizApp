using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveQuizCodeFromQuizzes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quizzes_QuizCode",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "QuizCode",
                table: "Quizzes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QuizCode",
                table: "Quizzes",
                type: "nvarchar(6)",
                maxLength: 6,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_QuizCode",
                table: "Quizzes",
                column: "QuizCode",
                unique: true);
        }
    }
}

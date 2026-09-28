using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Controllers;
using QuizApi.Data;
using QuizApi.DTOs.Quizzes;
using QuizApi.Models;

namespace QuizApi.Tests;

public class QuizzesControllerTests
{
    [Fact]
    public async Task Create_WithQuestions_PersistsQuestionsAndAnswers()
    {
        await using var context = CreateContext();
        await SeedBaseData(context);
        var controller = Controller(context, userId: 1);

        var request = new CreateQuizRequest
        {
            Title = "Full Science Quiz",
            Description = "A quiz with standard and True/False questions",
            CategoryId = 1,
            Duration = 20,
            MaxAttempts = 3,
            Visibility = QuizVisibility.Public,
            Questions =
            [
                new QuizQuestionInput
                {
                    Order = 1,
                    Content = "Is water liquid at 25 degrees Celsius?",
                    QuestionType = QuestionType.TrueFalse,
                    Answers =
                    [
                        new QuizAnswerInput { Content = "True", IsCorrect = true },
                        new QuizAnswerInput { Content = "False", IsCorrect = false }
                    ]
                },
                new QuizQuestionInput
                {
                    Order = 2,
                    Content = "Which planets are terrestrial?",
                    QuestionType = QuestionType.MultipleChoice,
                    Answers =
                    [
                        new QuizAnswerInput { Content = "Earth", IsCorrect = true },
                        new QuizAnswerInput { Content = "Mars", IsCorrect = true },
                        new QuizAnswerInput { Content = "Jupiter", IsCorrect = false }
                    ]
                }
            ]
        };

        var action = await controller.Create(request, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(action.Result);
        var response = Assert.IsType<QuizResponse>(created.Value);

        Assert.Equal("Full Science Quiz", response.Title);
        Assert.Equal(2, response.QuestionCount);
        Assert.Equal(2, response.Questions.Count);

        var tfQuestion = response.Questions[0];
        Assert.Equal(QuestionType.TrueFalse, tfQuestion.QuestionType);
        Assert.Equal(2, tfQuestion.Answers.Count);
        Assert.Contains(tfQuestion.Answers, a => a.Content == "True" && a.IsCorrect);
        Assert.Contains(tfQuestion.Answers, a => a.Content == "False" && !a.IsCorrect);

        var mcQuestion = response.Questions[1];
        Assert.Equal(QuestionType.MultipleChoice, mcQuestion.QuestionType);
        Assert.Equal(3, mcQuestion.Answers.Count);

        // Verify DB persistence
        var dbQuiz = await context.Quizzes
            .Include(q => q.QuizQuestions)
            .SingleAsync(q => q.Id == response.Id, CancellationToken.None);
        Assert.Equal(2, dbQuiz.QuizQuestions.Count);
    }

    [Fact]
    public async Task Update_WithNewQuestions_UpdatesQuizAndQuestions()
    {
        await using var context = CreateContext();
        await SeedBaseData(context);
        var controller = Controller(context, userId: 1);

        var createReq = new CreateQuizRequest
        {
            Title = "Initial Quiz",
            CategoryId = 1,
            Duration = 10,
            MaxAttempts = 1,
            Visibility = QuizVisibility.Public,
            Questions =
            [
                new QuizQuestionInput
                {
                    Order = 1,
                    Content = "Initial Q1",
                    QuestionType = QuestionType.SingleChoice,
                    Answers =
                    [
                        new QuizAnswerInput { Content = "A", IsCorrect = true },
                        new QuizAnswerInput { Content = "B", IsCorrect = false }
                    ]
                }
            ]
        };
        var createAction = await controller.Create(createReq, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(createAction.Result);
        var response = Assert.IsType<QuizResponse>(created.Value);

        var updateReq = new UpdateQuizRequest
        {
            Title = "Updated Quiz Title",
            CategoryId = 1,
            Duration = 15,
            MaxAttempts = 2,
            Visibility = QuizVisibility.Public,
            Questions =
            [
                new QuizQuestionInput
                {
                    Order = 1,
                    Content = "Replaced with True/False question",
                    QuestionType = QuestionType.TrueFalse,
                    Answers =
                    [
                        new QuizAnswerInput { Content = "True", IsCorrect = false },
                        new QuizAnswerInput { Content = "False", IsCorrect = true }
                    ]
                }
            ]
        };

        var updateAction = await controller.Update(response.Id, updateReq, CancellationToken.None);
        Assert.IsType<NoContentResult>(updateAction);

        var getAction = await controller.GetById(response.Id, CancellationToken.None);
        var getOk = Assert.IsType<OkObjectResult>(getAction.Result);
        var updatedResponse = Assert.IsType<QuizResponse>(getOk.Value);

        Assert.Equal("Updated Quiz Title", updatedResponse.Title);
        Assert.Single(updatedResponse.Questions);
        Assert.Equal(QuestionType.TrueFalse, updatedResponse.Questions[0].QuestionType);
        Assert.Equal(2, updatedResponse.Questions[0].Answers.Count);
        Assert.Contains(updatedResponse.Questions[0].Answers, a => a.Content == "False" && a.IsCorrect);
    }

    private static QuizzesController Controller(AppDbContext context, int userId)
    {
        var controller = new QuizzesController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"))
                }
            }
        };
        return controller;
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private static async Task SeedBaseData(AppDbContext context)
    {
        var owner = TestData.User(1);
        context.Add(owner);
        await context.SaveChangesAsync(CancellationToken.None);
    }
}

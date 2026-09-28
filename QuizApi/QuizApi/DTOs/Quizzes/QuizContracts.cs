using System.ComponentModel.DataAnnotations;
using QuizApi.Models;

namespace QuizApi.DTOs.Quizzes;

public class CreateQuizRequest
{
    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
    [Range(0, int.MaxValue)]
    public int Duration { get; set; }
    [Range(0, int.MaxValue)]
    public int MaxAttempts { get; set; }
    [EnumDataType(typeof(QuizVisibility))]
    public QuizVisibility Visibility { get; set; }
    public List<int>? QuestionIds { get; set; }
    public List<QuizQuestionInput>? Questions { get; set; }
}

public class QuizQuestionInput
{
    public int? Id { get; set; }
    public int Order { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public List<QuizAnswerInput> Answers { get; set; } = [];
}

public class QuizAnswerInput
{
    public int? Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class UpdateQuizRequest : CreateQuizRequest;

public class AddQuizQuestionRequest
{
    [Range(1, int.MaxValue)]
    public int QuestionId { get; set; }
    public int? QuestionVersionId { get; set; }
}

public class UpdateQuizQuestionVersionRequest
{
    [Range(1, int.MaxValue)]
    public int QuestionVersionId { get; set; }
}

public class QuizResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public QuizVisibility Visibility { get; set; }
    public int Duration { get; set; }
    public int MaxAttempts { get; set; }
    public bool IsActive { get; set; }
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerDisplayName { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public List<QuizQuestionResponse> Questions { get; set; } = [];
}

public class QuizQuestionResponse
{
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int VersionNumber { get; set; }
    public int LatestVersionNumber { get; set; }
    public bool HasNewerVersion => LatestVersionNumber > VersionNumber;
    public int Order { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public List<QuizQuestionAnswerResponse> Answers { get; set; } = [];
}

public class QuizQuestionAnswerResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class QuizPreviewResponse
{
    public int QuizId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Duration { get; set; }
    public List<QuizPreviewQuestionResponse> Questions { get; set; } = [];
}

public class QuizPreviewQuestionResponse
{
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int Order { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public List<QuizPreviewAnswerResponse> Answers { get; set; } = [];
}

public class QuizPreviewAnswerResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

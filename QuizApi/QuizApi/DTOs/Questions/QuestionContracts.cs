using System.ComponentModel.DataAnnotations;
using QuizApi.Models;

namespace QuizApi.DTOs.Questions;

public class CreateQuestionRequest
{
    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
    [Required]
    public string Content { get; set; } = string.Empty;
    [EnumDataType(typeof(QuestionType))]
    public QuestionType QuestionType { get; set; }
    [Required]
    public List<AnswerDefinitionRequest> Answers { get; set; } = [];
}

public class CreateQuestionVersionRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
    [EnumDataType(typeof(QuestionType))]
    public QuestionType QuestionType { get; set; }
    [Required]
    public List<AnswerDefinitionRequest> Answers { get; set; } = [];
}

public class AnswerDefinitionRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class CustomizeQuestionRequest
{
    public int? QuestionVersionId { get; set; }
}

public class QuestionSummaryResponse
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public int CurrentVersionId { get; set; }
    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public int PublicQuizCount { get; set; }
}

public class QuestionDetailResponse : QuestionSummaryResponse
{
    public int? SourceQuestionId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<QuestionVersionResponse> Versions { get; set; } = [];
}

public class QuestionVersionResponse
{
    public int Id { get; set; }
    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCurrent { get; set; }
    public List<AnswerResponse> Answers { get; set; } = [];
}

public class AnswerResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

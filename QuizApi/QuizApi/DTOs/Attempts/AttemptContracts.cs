using System.ComponentModel.DataAnnotations;
using QuizApi.Models;

namespace QuizApi.DTOs.Attempts;

public class StartAttemptRequest
{
    [Required, StringLength(6, MinimumLength = 6)]
    public string QuizCode { get; set; } = string.Empty;
}

public class SaveAnswerRequest
{
    [Required]
    public List<int> SelectedAnswerIds { get; set; } = [];
}

public class AttemptResponse
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public bool IsAutoSubmitted { get; set; }
    public List<AttemptQuestionResponse> Questions { get; set; } = [];
}

public class AttemptQuestionResponse
{
    public int AttemptQuestionId { get; set; }
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int Order { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public List<AttemptAnswerOptionResponse> Answers { get; set; } = [];
    public List<int> SelectedAnswerIds { get; set; } = [];
}

public class AttemptAnswerOptionResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class AttemptResultResponse
{
    public int AttemptId { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public int IncorrectAnswers => TotalQuestions - CorrectAnswers;
    public int TimeSpentSeconds { get; set; }
    public bool IsAutoSubmitted { get; set; }
    public List<AttemptQuestionResultResponse> Questions { get; set; } = [];
}

public class AttemptQuestionResultResponse
{
    public int QuestionId { get; set; }
    public int QuestionVersionId { get; set; }
    public int Order { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public List<ResultAnswerResponse> Answers { get; set; } = [];
}

public class ResultAnswerResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public bool IsSelected { get; set; }
}

public class UserAttemptSummaryResponse
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public string QuizCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public int TotalQuestions { get; set; }
    public int? CorrectAnswers { get; set; }
    public int? Score { get; set; }
    public int? TimeSpentSeconds { get; set; }
    public bool IsAutoSubmitted { get; set; }
}

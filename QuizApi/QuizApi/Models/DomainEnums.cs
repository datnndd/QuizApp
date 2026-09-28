namespace QuizApi.Models;

public enum QuestionType
{
    SingleChoice,
    MultipleChoice,
    TrueFalse
}

public enum QuizVisibility
{
    Private,
    Public
}

public enum QuizAttemptStatus
{
    InProgress,
    Submitted
}

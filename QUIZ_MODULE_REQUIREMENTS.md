# Quiz Module Requirements

## 1. Purpose

This document defines the functional and business requirements for the Quiz module of the Quiz App.

The module covers:

- Quiz creation and management
- Question creation and reuse
- Question Bank
- Question versioning
- Public and private quizzes
- Quiz participation
- Quiz attempts
- Answer persistence
- Quiz timing
- Automatic submission
- Scoring and result review

The main design goal is to keep the system simple for users while still supporting question reuse, version history, and safe editing of quizzes that may already have existing attempts.

---

# 2. Core Concepts

The main domain entities are:

- User
- Quiz
- Question
- QuestionVersion
- Answer
- QuizQuestion
- QuizAttempt
- UserAnswer
- Category

A Question is reusable across multiple Quizzes.

A Quiz references a specific version of each Question.

Question versions are visible to users and are not only used internally by the backend.

---

# 3. Category

The system will use a single `Category` concept instead of separating Subject and Topic.

Examples:

- Mathematics
- Science
- AI
- Programming
- English
- History

This keeps the UI simple and avoids forcing users to understand multiple levels of classification.

A Quiz belongs to one Category.

A Question also belongs to one Category.

When adding questions to a Quiz, the Question Bank should be filtered by the Quiz's Category by default.

Users may remove or change the filter if they want to search other categories.

---

# 4. Question Ownership

Every Question has exactly one owner.

Example:

```text
Question #10
Owner = User A
```

If User B reuses Question #10 without modifying it, no new Question is created.

User B's Quiz simply references the same Question.

Ownership remains unchanged.

```text
User A
  └── Question #10
        ├── Quiz A
        ├── Quiz B
        └── Quiz C
```

Even if many users reuse a Question, the original creator remains the owner.

---

# 5. Reusing Questions

Users may reuse Questions from the Question Bank.

There are two possible actions.

## 5.1 Use Without Modification

If a user selects **Use**, the system:

1. Does not create a new Question.
2. References the selected Question.
3. Uses the selected QuestionVersion.
4. Keeps the original Question owner.

Example:

```text
Question #10
Owner = User A

User B selects "Use"

Quiz B
  └── Question #10
```

There is still only one Question record.

---

## 5.2 Customize a Question

If a user selects **Customize**, the system creates a new Question.

Example:

```text
Question #10
Owner = User A
        |
        | Customize
        v
Question #25
Owner = User B
SourceQuestionId = 10
```

The new Question:

- belongs to the user who customized it
- is independent from the source Question
- stores `SourceQuestionId` for lineage tracking
- may be modified freely

The source relationship may be visible in system history, but it does not need to be emphasized in the normal Question Bank UI.

---

# 6. Question Types

The system initially supports three Question types:

1. Single Choice
2. Multiple Choice
3. True / False

---

# 7. Question Versioning

Questions must support version history.

Editing an existing Question must never overwrite an existing version.

Instead, a new QuestionVersion is created.

Example:

```text
Question #10

v1
v2
v3
```

The latest version is considered the current version of the Question.

Users should be able to see version information.

Example:

```text
What is machine learning?

Version 3
Created by Andy
Updated Sep 21, 2026
```

The Question detail page should allow users to view previous versions.

Example:

```text
Version History

v3 - Current
v2
v1
```

---

# 8. Updating Questions Used by Quizzes

When a Question receives a new version, existing Quizzes must not update automatically.

Example:

```text
Question #10

v1
v2
v3 <- latest
```

Existing Quizzes may use:

```text
Quiz A -> v1
Quiz B -> v2
Quiz C -> v3
```

Creating `v4` does not automatically change any Quiz.

The Quiz owner may manually update a QuizQuestion to the latest version.

The UI should indicate when a newer version exists.

Example:

```text
Question 4

Using version: v2

A newer version v3 is available.

[View Changes]
[Update to v3]
```

---

# 9. Using a Question Version

When a user selects a Question from the Question Bank, the system should use the latest version by default.

Users may view the version history and choose another version if needed.

Example:

```text
v3 - Current    [Use this version]
v2              [Use this version]
v1              [Use this version]
```

---

# 10. Quiz Creation

A Quiz may be created with the following information:

- Title
- Description
- Category
- Duration
- Maximum Attempts
- Visibility

A Quiz becomes usable immediately after creation.

There is no Draft or Publish workflow in the current scope.

Basic flow:

```text
Create Quiz
    |
    v
Enter Quiz Information
    |
    v
Add Questions
    |
    v
Quiz Ready
```

---

# 11. Quiz Visibility

Quiz visibility has only two states:

- Public
- Private

Question itself does not have a Public or Private property.

Question visibility/discoverability is derived from the Quiz that uses it.

This keeps the model simple and avoids conflicting states such as:

```text
Private Quiz + Public Question
```

---

# 12. Private Quiz

A Private Quiz:

- can only be viewed by its owner
- cannot be taken by other users
- cannot be accessed by QuizCode by another user
- does not expose its Questions through the public Question Bank

The owner may still preview the Quiz.

---

# 13. Public Quiz

A Public Quiz:

- may be accessed by other authenticated users
- may be joined using QuizCode
- may be taken by other users
- exposes its Questions to the public Question Bank

Only Public Quizzes can be taken by users other than the owner.

---

# 14. Question Bank Discoverability

A Question does not store a visibility field.

A Question appears in the public Question Bank when it is used by at least one Public Quiz.

Example:

```text
Question #10

Quiz A -> Public
Quiz B -> Private
Quiz C -> Private
```

Question #10 appears in the public Question Bank because it is used by Quiz A.

If Quiz A later becomes Private and there are no other Public Quizzes using Question #10, the Question disappears from the public Question Bank.

The Question is not deleted.

Existing Quizzes can continue using it.

---

# 15. Question Bank

The Question Bank should provide at least two views:

```text
[ Explore ] [ My Questions ]
```

## Explore

Contains Questions that are discoverable through Public Quizzes.

Supported filters:

- Search text
- Category
- Author

A Question should appear only once even if it is used by multiple Public Quizzes.

Example:

```text
What is machine learning?

AI
Single Choice
Version 3

Created by Andy
Used in 12 public quizzes

[View]
[Use]
```

---

## My Questions

Contains all Questions owned by the current user.

This includes Questions currently used only in Private Quizzes.

---

# 16. Author Information

Question cards should display the original author.

Example:

```text
Created by Andy
```

Users may click the author name to view that author's Questions.

Example:

```text
Andy Nguyen

Questions
42

AI
12 questions

Programming
20 questions

Science
10 questions
```

Only Questions visible through the public Question Bank should be shown to other users.

---

# 17. QuizQuestion

`QuizQuestion` represents the relationship between Quiz and Question.

It should include:

```text
QuizId
QuestionId
QuestionVersionId
Order
```

`Order` determines the Question sequence in the Quiz.

The order is assigned based on the time the Question is added.

Example:

```text
Question A -> Order 1
Question B -> Order 2
Question C -> Order 3
```

If Question B is removed, remaining Questions should be reordered:

```text
Question A -> Order 1
Question C -> Order 2
```

Future drag-and-drop reordering may update this field.

---

# 18. Duplicate Questions in a Quiz

The same Question must not appear more than once in the same Quiz.

Example:

```text
Quiz #1

Question #10
Question #11
Question #10  <- Not allowed
```

The system should prevent duplicate Question references within a Quiz.

---

# 19. QuizCode

Every Quiz has a fixed QuizCode.

Example:

```text
QuizId: 153
QuizCode: K7P2XY
```

QuizCode allows users to join a Quiz without knowing the internal QuizId or a long URL.

Typical flow:

```text
Join Quiz

[ K7P2XY ] [Join]
```

QuizCode is not a password.

Access still depends on Quiz visibility.

If the Quiz is Private, another user cannot access it even if they know the QuizCode.

---

# 20. Authentication Requirement

Users must be logged in before taking a Quiz.

Guest Quiz attempts are not supported.

---

# 21. Joining a Quiz

Basic flow:

```text
User Login
    |
    v
Enter QuizCode
    |
    v
Find Quiz
    |
    +---- Quiz not found
    |       -> Invalid QuizCode
    |
    v
Check Visibility
    |
    +---- Private
    |       -> Access Denied
    |
    v
Check Attempt Limit
    |
    v
Start Quiz
```

---

# 22. Maximum Attempts

The Quiz owner chooses how many times a user may attempt the Quiz.

Example values:

```text
1
2
3
...
Unlimited
```

Recommended representation:

```text
MaxAttempts = 0
```

means unlimited attempts.

An attempt counts as soon as the user starts the Quiz.

This prevents users from repeatedly starting and abandoning a Quiz without consuming an attempt.

---

# 23. Quiz Duration

Quiz duration is stored in minutes.

```text
Duration = 30
```

means 30 minutes.

```text
Duration = 0
```

means unlimited time.

---

# 24. Quiz Timer

When a timed Quiz starts:

```text
ExpiresAt = StartedAt + Duration
```

The backend is the source of truth for expiration time.

The frontend timer is only used for display.

This prevents users from manipulating the frontend timer.

Example:

```text
StartedAt = 10:00
Duration = 30 minutes

ExpiresAt = 10:30
```

---

# 25. Automatic Submission

When the Quiz timer reaches zero, the Quiz is automatically submitted.

Current answers are used for grading.

Example:

```text
Timer = 00:00
    |
    v
Auto Submit
    |
    v
Grade Quiz
    |
    v
Show Result
```

---

# 26. QuizAttempt

A QuizAttempt represents one attempt by a user.

Suggested conceptual fields:

```text
Id
QuizId
UserId

StartedAt
SubmittedAt

Status
TimeSpent

Score
TotalQuestions
CorrectAnswers

IsAutoSubmitted
```

Supported statuses:

```text
InProgress
Submitted
```

---

# 27. Starting an Attempt

When the user clicks **Start Quiz**, the backend creates a QuizAttempt.

Example:

```text
QuizAttempt

Status = InProgress
StartedAt = Current Time
```

The attempt starts at this moment.

---

# 28. Resume Quiz

Users may resume an unfinished QuizAttempt.

Example:

```text
10:00 Start Quiz
10:05 Close browser
10:10 Login again
```

If the attempt has not expired:

```text
[Resume Quiz]
```

The previously selected answers must be restored.

For timed Quizzes, the original expiration time remains unchanged.

Restarting the browser must not reset the timer.

---

# 29. Answer Persistence

Users do not submit each Question individually.

The entire Quiz is submitted only once.

However, answer state should be saved whenever the user selects or changes an answer.

Example:

```text
Question 1

A
B <- selected
C
D
```

Selecting B immediately persists the current answer state.

This allows:

- page refresh recovery
- browser crash recovery
- resume functionality
- reduced risk of losing completed answers

---

# 30. Single Choice Persistence

For Single Choice Questions, one Answer may be selected.

Example:

```text
QuestionVersionId = 12
SelectedAnswerId = 45
```

If the user changes the answer, the stored state is updated.

---

# 31. True / False Persistence

True / False uses the same behavior as Single Choice.

Only one option may be selected.

---

# 32. Multiple Choice Persistence

Multiple Choice Questions may contain multiple selected Answers.

Example:

```text
SelectedAnswers = [A, C]
```

Each change updates the saved answer state.

The Question is not graded until the Quiz is submitted.

---

# 33. Navigation During a Quiz

Users may move freely between Questions.

Supported navigation:

```text
Previous
Next
```

Users may revisit and change previous answers before submission.

---

# 34. Quiz Submission

A Quiz is submitted only once per attempt.

Submission may occur in two ways:

1. User manually clicks Submit
2. Timer reaches zero

After submission:

- the attempt status becomes `Submitted`
- answers can no longer be modified
- the result is calculated
- the result is shown immediately

---

# 35. Scoring

Every Question has equal weight.

There is no custom Points field in the current scope.

Example:

```text
10 Questions
8 Correct

Score = 8 / 10
```

---

# 36. Multiple Choice Scoring

Multiple Choice uses all-or-nothing grading.

Example:

Correct Answers:

```text
A
C
D
```

User selects:

```text
A
C
D
```

Result:

```text
Correct
```

If the user selects:

```text
A
C
```

Result:

```text
Incorrect
```

Selecting an extra answer is also incorrect.

Partial scoring is not supported.

---

# 37. Result Display

Quiz results are shown immediately after submission.

The user should be able to review:

- Score
- Total Questions
- Correct Answers
- Incorrect Answers
- Each Question
- User's Answer
- Correct Answer

Example:

```text
Score: 8 / 10

Question 1
Your Answer: B
Correct Answer: C
Result: Incorrect

Question 2
Your Answer: A
Correct Answer: A
Result: Correct
```

---

# 38. Editing a Quiz After Attempts Exist

Quiz owners may modify a Quiz even after users have completed attempts.

Example original Quiz:

```text
A v1
B v1
C v1
```

Owner later:

- removes B
- updates A to v2
- adds D

New Quiz state:

```text
A v2
C v1
D v1
```

Existing attempts must remain unchanged.

Example old attempt:

```text
A v1
B v1
C v1
```

New attempts use the current Quiz state:

```text
A v2
C v1
D v1
```

---

# 39. Attempt History Integrity

An attempt must preserve the exact Question versions used when the attempt started.

Changes to Questions after an attempt starts must never affect that attempt.

Example:

```text
Quiz currently uses:

A v2
B v5
C v1
```

Attempt #100 starts.

Later, Question A receives v3.

Attempt #100 must continue using:

```text
A v2
B v5
C v1
```

---

# 40. Preview Mode

Quiz owners may preview their own Quiz.

Preview mode:

- does not create a QuizAttempt
- does not affect attempt statistics
- does not consume MaxAttempts
- allows the owner to test the Quiz experience

Example:

```text
[Preview]
```

---

# 41. Soft Delete

Questions should use soft delete.

Example:

```text
IsActive = false
```

A deleted Question:

- should no longer appear in normal Question Bank search
- must remain available for historical Quizzes and Attempts
- must not break existing QuestionVersion references

The same principle may be applied to Quizzes.

---

# 42. Suggested Data Model

## Question

```text
Question

Id
OwnerId
CategoryId
SourceQuestionId nullable
CurrentVersionId
IsActive
CreatedAt
```

---

## QuestionVersion

```text
QuestionVersion

Id
QuestionId
VersionNumber
Content
QuestionType
CreatedAt
```

---

## Answer

```text
Answer

Id
QuestionVersionId
Content
IsCorrect
```

---

## Quiz

```text
Quiz

Id
OwnerId

Title
Description
CategoryId

QuizCode
Visibility

Duration
MaxAttempts

IsActive
CreatedAt
```

Visibility:

```text
Public
Private
```

---

## QuizQuestion

```text
QuizQuestion

QuizId
QuestionId
QuestionVersionId
Order
```

Recommended uniqueness rule:

```text
QuizId + QuestionId
```

---

## QuizAttempt

```text
QuizAttempt

Id
QuizId
UserId

StartedAt
SubmittedAt

Status
TimeSpent

Score
TotalQuestions
CorrectAnswers

IsAutoSubmitted
```

---

## UserAnswer

The exact structure may vary depending on implementation.

It must support:

- Single Choice
- Multiple Choice
- True / False
- persistence before final submission
- restoring saved answers when resuming an attempt

The saved answer must be associated with:

```text
QuizAttempt
QuestionVersion
Selected Answer(s)
```

---

# 43. Important Business Rules

## BR-01

Every Question has exactly one owner.

## BR-02

Reusing a Question without modification does not create a duplicate Question.

## BR-03

Customizing another user's Question creates a new Question.

## BR-04

A customized Question stores the source Question for lineage tracking.

## BR-05

Editing a Question creates a new QuestionVersion.

## BR-06

Existing Quizzes do not automatically upgrade to new Question versions.

## BR-07

Quiz owners manually decide when to update a Question version.

## BR-08

A Question may be reused by multiple Quizzes.

## BR-09

The same Question cannot appear twice in the same Quiz.

## BR-10

Question order is determined by `QuizQuestion.Order`.

## BR-11

Question itself has no Public/Private property.

## BR-12

Question discoverability is derived from Public Quizzes.

## BR-13

Only Public Quizzes may be taken by other users.

## BR-14

Private Quizzes are visible only to their owner.

## BR-15

All Quiz participants must be authenticated.

## BR-16

QuizCode is used to locate a Quiz, not to bypass access control.

## BR-17

Duration `0` means unlimited time.

## BR-18

MaxAttempts `0` means unlimited attempts.

## BR-19

An attempt starts when the user clicks Start Quiz.

## BR-20

Answer state is persisted whenever the user changes an answer.

## BR-21

Users submit the entire Quiz only once.

## BR-22

Timed Quizzes are automatically submitted when time expires.

## BR-23

Multiple Choice uses all-or-nothing grading.

## BR-24

Results are shown immediately after submission.

## BR-25

Users may resume unfinished attempts.

## BR-26

Old attempts must always preserve the exact Question versions used when the attempt started.

## BR-27

Preview mode does not create a real QuizAttempt.

## BR-28

Questions use soft delete.

---

# 44. End-to-End Quiz Creation Flow

```text
Create Quiz
    |
    v
Enter:
- Title
- Description
- Category
- Duration
- Max Attempts
- Visibility
    |
    v
Add Questions
    |
    +-------------------------+
    |                         |
    v                         v
Create New              Question Bank
                              |
                       +------+------+
                       |             |
                       v             v
                      Use        Customize
                       |             |
                       |       Create new Question
                       |       with SourceQuestionId
                       |             |
                       +------+------+
                              |
                              v
                        QuizQuestion
                              |
                         Assign Order
                              |
                              v
                          Quiz Ready
```

---

# 45. End-to-End Quiz Attempt Flow

```text
Authenticated User
      |
      v
Enter QuizCode
      |
      v
Find Quiz
      |
      v
Check Public
      |
      v
Check Attempt Limit
      |
      v
Start Quiz
      |
      v
Create QuizAttempt
      |
      v
Load Question Versions
      |
      v
User Answers Questions
      |
      v
Persist Answer State
on every selection/change
      |
      +----------------------+
      |                      |
      v                      v
Manual Submit           Timer Expires
      |                      |
      +----------+-----------+
                 |
                 v
            Submit Attempt
                 |
                 v
             Grade Quiz
                 |
                 v
            Show Result
```

---

# 46. Edge Cases

## Question Used by Public and Private Quizzes

A Question may be used by both Public and Private Quizzes.

If at least one Public Quiz uses it, the Question may appear in Explore.

---

## Public Quiz Becomes Private

If the last Public Quiz using a Question becomes Private:

- the Question disappears from Explore
- the Question is not deleted
- existing Quizzes continue to use it
- historical attempts remain valid

---

## Question Updated During an Active Attempt

If a Question receives a new version while a user is taking a Quiz:

- the active attempt continues using the version captured at attempt start
- the user must not suddenly receive the new Question version

---

## Quiz Updated During an Active Attempt

If the owner changes the Quiz while another user has an active attempt:

- the active attempt continues using its original Question set
- new attempts use the updated Quiz

---

## Browser Refresh

Refreshing the browser must:

- preserve selected answers
- preserve attempt state
- preserve the original timer expiration
- allow the user to continue the attempt

---

## Timer Expires While User Is Offline

The backend must determine whether the attempt has expired based on the original `StartedAt` and Quiz duration.

The frontend timer must not be trusted as the authoritative source.

---

# 47. Current Scope Exclusions

The following features are intentionally not required in the current scope:

- Guest Quiz attempts
- Draft / Published Quiz lifecycle
- Question-level Public / Private visibility
- Custom points per Question
- Partial credit for Multiple Choice
- Advanced multi-level Subject/Topic hierarchy
- Password-protected Quizzes
- Invite-only Quizzes
- Unlisted Quiz visibility
- Automatic upgrading of Questions inside existing Quizzes
- Per-question submission

These features may be considered in future iterations if needed.

---

# 48. Acceptance Baseline

The Quiz module can be considered functionally complete for the current scope when:

1. A logged-in user can create a Quiz.
2. A Quiz can be Public or Private.
3. A Quiz has a fixed QuizCode.
4. A user can create Questions.
5. A Question can have multiple versions.
6. Users can see Question version history.
7. Public Questions can be discovered through Public Quizzes.
8. Users can reuse another user's Question without duplicating it.
9. Users can Customize another user's Question into a new owned Question.
10. Questions can be added to Quizzes with stable ordering.
11. Duplicate Questions cannot be added to the same Quiz.
12. Quiz owners can manually upgrade a QuizQuestion to a newer QuestionVersion.
13. Logged-in users can join Public Quizzes using QuizCode.
14. Attempt limits are enforced.
15. Timed Quizzes support auto-submit.
16. Unlimited duration is supported.
17. Selected answers are persisted before final submission.
18. Users can move backward and forward between Questions.
19. Users can resume unfinished attempts.
20. Multiple Choice is graded using all-or-nothing logic.
21. Results are shown immediately after submission.
22. Result review shows the user's answer and the correct answer.
23. Existing attempts remain unchanged when the Quiz or Questions are edited.
24. Quiz owners can Preview without creating an attempt.
25. Soft-deleted Questions do not break historical data.

---

# 49. Summary

The design is based on a few key principles:

- Keep Quiz visibility simple: Public or Private.
- Do not add separate Question visibility.
- Treat Questions as reusable shared resources with a clear owner.
- Avoid duplicate Questions when users simply reuse existing content.
- Create a new Question only when a user chooses to Customize it.
- Make Question versions visible and understandable to users.
- Never silently update Questions inside existing Quizzes.
- Preserve the exact content used by historical attempts.
- Save answer state continuously, but submit the Quiz only once.
- Keep scoring simple and predictable.
- Prioritize a simple user experience while keeping the data model safe for future growth.

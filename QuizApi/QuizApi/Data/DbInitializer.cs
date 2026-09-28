using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using QuizApi.Models;

namespace QuizApi.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Ensure database is up to date
            await context.Database.MigrateAsync();

            // Seed Roles (strictly Admin and User)
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null)
            {
                adminRole = new Role
                {
                    Name = "Admin",
                    Description = "Administrator with full system privileges",
                    IsActive = true
                };
                context.Roles.Add(adminRole);
            }

            var userRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole == null)
            {
                userRole = new Role
                {
                    Name = "User",
                    Description = "Standard student/learner user",
                    IsActive = true
                };
                context.Roles.Add(userRole);
            }

            await context.SaveChangesAsync();

            // Seed default Admin user if none exists
            var defaultAdmin = await context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.UserName == "admin" || u.Email == "admin@quizzo.com");

            if (defaultAdmin == null)
            {
                defaultAdmin = new User
                {
                    FirstName = "Alex",
                    LastName = "Morgan",
                    DisplayName = "Alex Morgan",
                    Email = "admin@quizzo.com",
                    UserName = "admin",
                    PhoneNumber = "+1 (555) 000-0001",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddMonths(-6)
                };

                context.Users.Add(defaultAdmin);
                await context.SaveChangesAsync();

                context.UserRoles.Add(new UserRole { UserId = defaultAdmin.Id, RoleId = adminRole.Id });
                await context.SaveChangesAsync();
            }

            // Ensure nguyendoandatada@gmail.com has Admin role if registered
            var specialAdminUser = await context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email == "nguyendoandatada@gmail.com");
            if (specialAdminUser != null && !specialAdminUser.UserRoles.Any(ur => ur.RoleId == adminRole.Id))
            {
                context.UserRoles.Add(new UserRole { UserId = specialAdminUser.Id, RoleId = adminRole.Id });
                await context.SaveChangesAsync();
            }

            // Ensure at least 30 mock users are seeded
            var existingUserCount = await context.Users.CountAsync();
            if (existingUserCount < 30)
            {
                var mockUserDefinitions = new (string FirstName, string LastName, string Email, string UserName, string Phone, string Role, bool IsActive, bool IsDeleted, int DaysAgoDeleted, int MonthsAgoCreated)[]
                {
                    ("Sarah", "Jenkins", "s.jenkins@oxford.ac.uk", "sjenkins", "+1 (555) 100-0002", "Admin", true, false, 0, 5),
                    ("Marcus", "Chen", "marcus.c@stanford.edu", "mchen", "+1 (555) 100-0003", "Admin", true, false, 0, 5),
                    ("Maya", "Patel", "m.patel@harvard.edu", "mpatel", "+1 (555) 100-0004", "Admin", true, false, 0, 4),
                    ("Daniel", "Walker", "d.walker@rice.edu", "dwalker", "+1 (555) 100-0005", "Admin", true, false, 0, 4),
                    ("Elena", "Rostova", "elena.rostova@mit.edu", "erostova", "+1 (555) 200-0006", "User", true, false, 0, 3),
                    ("David", "Kim", "david.kim@berkeley.edu", "dkim", "+1 (555) 200-0007", "User", false, false, 0, 3),
                    ("Liam", "O'Connor", "l.oconnor@cambridge.ac.uk", "loconnor", "+1 (555) 200-0008", "User", true, false, 0, 3),
                    ("Chloe", "Zhao", "chloe.z@nyu.edu", "czhao", "+1 (555) 200-0009", "User", true, false, 0, 3),
                    ("James", "Wilson", "j.wilson@columbia.edu", "jwilson", "+1 (555) 200-0010", "User", true, false, 0, 2),
                    ("Sophia", "Martinez", "s.martinez@yale.edu", "smartinez", "+1 (555) 200-0011", "User", true, false, 0, 2),
                    ("Benjamin", "Lee", "b.lee@princeton.edu", "blee", "+1 (555) 200-0012", "User", true, false, 0, 2),
                    ("Olivia", "Taylor", "o.taylor@uchicago.edu", "otaylor", "+1 (555) 200-0013", "User", false, false, 0, 2),
                    ("Lucas", "Garcia", "l.garcia@ucla.edu", "lgarcia", "+1 (555) 200-0014", "User", true, false, 0, 2),
                    ("Emma", "Anderson", "e.anderson@cornell.edu", "eanderson", "+1 (555) 200-0015", "User", true, false, 0, 2),
                    ("Henry", "Thomas", "h.thomas@caltech.edu", "hthomas", "+1 (555) 200-0016", "User", false, true, 2, 2),
                    ("Ava", "Jackson", "a.jackson@upenn.edu", "ajackson", "+1 (555) 200-0017", "User", true, false, 0, 2),
                    ("Noah", "White", "n.white@brown.edu", "nwhite", "+1 (555) 200-0018", "User", true, false, 0, 1),
                    ("Isabella", "Harris", "i.harris@dartmouth.edu", "iharris", "+1 (555) 200-0019", "User", true, false, 0, 1),
                    ("Ethan", "Martin", "e.martin@northwestern.edu", "emartin", "+1 (555) 200-0020", "User", true, false, 0, 1),
                    ("Mia", "Clark", "m.clark@jhu.edu", "mclark", "+1 (555) 200-0021", "User", true, false, 0, 1),
                    ("Alexander", "Lewis", "a.lewis@duke.edu", "alewis", "+1 (555) 200-0022", "User", false, false, 0, 1),
                    ("Charlotte", "Robinson", "c.robinson@vanderbilt.edu", "crobinson", "+1 (555) 200-0023", "User", true, false, 0, 1),
                    ("Harper", "Young", "h.young@notredame.edu", "hyoung", "+1 (555) 200-0024", "User", true, false, 0, 1),
                    ("Matthew", "Allen", "m.allen@washu.edu", "mallen", "+1 (555) 200-0025", "User", true, false, 0, 1),
                    ("Evelyn", "King", "e.king@georgetown.edu", "eking", "+1 (555) 200-0026", "User", false, true, 5, 1),
                    ("Jack", "Wright", "j.wright@emory.edu", "jwright", "+1 (555) 200-0027", "User", true, false, 0, 1),
                    ("Abigail", "Scott", "a.scott@cmu.edu", "ascott", "+1 (555) 200-0028", "User", true, false, 0, 1),
                    ("Samuel", "Green", "s.green@virginia.edu", "sgreen", "+1 (555) 200-0029", "User", true, false, 0, 1),
                    ("Elizabeth", "Baker", "e.baker@tufts.edu", "ebaker", "+1 (555) 200-0030", "User", true, false, 0, 1),
                    ("Oliver", "Harris", "oliver.h@stanford.edu", "oharris", "+1 (555) 200-0031", "User", true, false, 0, 1)
                };

                var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123456");

                foreach (var def in mockUserDefinitions)
                {
                    var exists = await context.Users.AnyAsync(u => u.Email == def.Email || u.UserName == def.UserName);
                    if (exists) continue;

                    var targetRole = def.Role == "Admin" ? adminRole : userRole;

                    var user = new User
                    {
                        FirstName = def.FirstName,
                        LastName = def.LastName,
                        DisplayName = $"{def.FirstName} {def.LastName}",
                        Email = def.Email,
                        UserName = def.UserName,
                        PhoneNumber = def.Phone,
                        PasswordHash = def.Role == "Admin" ? BCrypt.Net.BCrypt.HashPassword("Admin@123456") : defaultPasswordHash,
                        IsActive = def.IsActive,
                        IsDeleted = def.IsDeleted,
                        DeletedAt = def.IsDeleted ? DateTime.UtcNow.AddDays(-def.DaysAgoDeleted) : null,
                        CreatedAt = DateTime.UtcNow.AddMonths(-def.MonthsAgoCreated)
                    };

                    context.Users.Add(user);
                    await context.SaveChangesAsync();

                    context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = targetRole.Id
                    });
                }

                await context.SaveChangesAsync();
            }

            // Seed sample quizzes authored by existing users
            await SeedQuizzesAsync(context);
        }

        private static async Task SeedQuizzesAsync(AppDbContext context)
        {
            var quizDefinitions = new[]
            {
                new
                {
                    AuthorUserName = "mchen", // Marcus Chen
                    CategoryName = "Programming",
                    Title = "Introduction to C# and .NET Fundamentals",
                    Description = "Test your core knowledge of modern C# syntax, type safety, memory management, and .NET runtime essentials.",
                    Duration = 15,
                    MaxAttempts = 3,
                    DaysAgo = 10,
                    Questions = new[]
                    {
                        new
                        {
                            Content = "Which keyword in C# is used to define an immutable reference type with value-based equality semantics?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("record", true),
                                ("class", false),
                                ("struct", false),
                                ("interface", false)
                            }
                        },
                        new
                        {
                            Content = "In modern .NET, value types are always allocated on the stack regardless of context.",
                            Type = QuestionType.TrueFalse,
                            Answers = new[]
                            {
                                ("False", true),
                                ("True", false)
                            }
                        },
                        new
                        {
                            Content = "Which of the following are valid type member access modifiers in C#?",
                            Type = QuestionType.MultipleChoice,
                            Answers = new[]
                            {
                                ("internal", true),
                                ("protected internal", true),
                                ("package-private", false),
                                ("friend", false)
                            }
                        }
                    }
                },
                new
                {
                    AuthorUserName = "mpatel", // Maya Patel
                    CategoryName = "AI",
                    Title = "Foundations of Artificial Intelligence & Machine Learning",
                    Description = "Explore essential concepts in machine learning, neural networks, supervised vs unsupervised learning, and model evaluation.",
                    Duration = 20,
                    MaxAttempts = 5,
                    DaysAgo = 7,
                    Questions = new[]
                    {
                        new
                        {
                            Content = "Which metric is most appropriate for evaluating a binary classification model trained on heavily imbalanced datasets?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("F1-Score / PR-AUC", true),
                                ("Raw Accuracy", false),
                                ("Mean Squared Error", false),
                                ("Mean Absolute Percentage Error", false)
                            }
                        },
                        new
                        {
                            Content = "Supervised learning algorithms require labeled training datasets to establish input-output mappings.",
                            Type = QuestionType.TrueFalse,
                            Answers = new[]
                            {
                                ("True", true),
                                ("False", false)
                            }
                        },
                        new
                        {
                            Content = "In deep neural networks, what is the primary role of an activation function like ReLU?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("To introduce non-linearity into the network", true),
                                ("To initialize synaptic weights to zero", false),
                                ("To eliminate gradient updates during backpropagation", false),
                                ("To compress network layers into one dimension", false)
                            }
                        }
                    }
                },
                new
                {
                    AuthorUserName = "sjenkins", // Sarah Jenkins
                    CategoryName = "Science",
                    Title = "Physics: Classical Mechanics & Thermodynamics",
                    Description = "Challenge your understanding of Newtonian laws, energy conservation, kinetic theory, and thermodynamic principles.",
                    Duration = 25,
                    MaxAttempts = 0,
                    DaysAgo = 5,
                    Questions = new[]
                    {
                        new
                        {
                            Content = "According to Newton's Second Law of Motion, the acceleration of an object is directly proportional to what quantity?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("The net force acting on the object", true),
                                ("The total mass of the object", false),
                                ("The instantaneous velocity of the object", false),
                                ("The atmospheric pressure", false)
                            }
                        },
                        new
                        {
                            Content = "The Second Law of Thermodynamics states that the total entropy of an isolated system can never decrease over time.",
                            Type = QuestionType.TrueFalse,
                            Answers = new[]
                            {
                                ("True", true),
                                ("False", false)
                            }
                        },
                        new
                        {
                            Content = "Which of the following are vector quantities in classical physics?",
                            Type = QuestionType.MultipleChoice,
                            Answers = new[]
                            {
                                ("Velocity", true),
                                ("Acceleration", true),
                                ("Speed", false),
                                ("Temperature", false)
                            }
                        }
                    }
                },
                new
                {
                    AuthorUserName = "erostova", // Elena Rostova
                    CategoryName = "Mathematics",
                    Title = "Calculus & Linear Algebra Core Concepts",
                    Description = "A concise review of differential calculus, matrix invertibility, linear transformations, and vector spaces.",
                    Duration = 15,
                    MaxAttempts = 2,
                    DaysAgo = 3,
                    Questions = new[]
                    {
                        new
                        {
                            Content = "What is the derivative of f(x) = ln(x) with respect to x for x > 0?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("1 / x", true),
                                ("e^x", false),
                                ("x", false),
                                ("1 / (x^2)", false)
                            }
                        },
                        new
                        {
                            Content = "A square matrix is invertible if and only if its determinant is non-zero.",
                            Type = QuestionType.TrueFalse,
                            Answers = new[]
                            {
                                ("True", true),
                                ("False", false)
                            }
                        },
                        new
                        {
                            Content = "What is the rank of an n x n identity matrix?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("n", true),
                                ("0", false),
                                ("1", false),
                                ("n - 1", false)
                            }
                        }
                    }
                },
                new
                {
                    AuthorUserName = "loconnor", // Liam O'Connor
                    CategoryName = "History",
                    Title = "World History: Ancient Civilizations & Trade Routes",
                    Description = "Explore foundational milestones, cultural achievements, and historic trade networks across ancient civilizations.",
                    Duration = 15,
                    MaxAttempts = 3,
                    DaysAgo = 2,
                    Questions = new[]
                    {
                        new
                        {
                            Content = "Between which two river systems did the civilization of Mesopotamia flourish?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("Tigris and Euphrates", true),
                                ("Nile and Congo", false),
                                ("Indus and Ganges", false),
                                ("Yangtze and Yellow River", false)
                            }
                        },
                        new
                        {
                            Content = "The discovery of the Rosetta Stone in 1799 was crucial in deciphering ancient Egyptian hieroglyphs.",
                            Type = QuestionType.TrueFalse,
                            Answers = new[]
                            {
                                ("True", true),
                                ("False", false)
                            }
                        },
                        new
                        {
                            Content = "The historic Silk Road primarily served as an overland and maritime trade network connecting East Asia with which region?",
                            Type = QuestionType.SingleChoice,
                            Answers = new[]
                            {
                                ("The Mediterranean and Europe", true),
                                ("The Americas", false),
                                ("Sub-Saharan Africa", false),
                                ("Antarctica", false)
                            }
                        }
                    }
                }
            };

            foreach (var qDef in quizDefinitions)
            {
                if (await context.Quizzes.AnyAsync(q => q.Title == qDef.Title))
                    continue;

                var author = await context.Users.FirstOrDefaultAsync(u => u.UserName == qDef.AuthorUserName)
                             ?? await context.Users.FirstOrDefaultAsync(u => u.IsActive && !u.IsDeleted);
                if (author == null) continue;

                var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == qDef.CategoryName)
                               ?? await context.Categories.FirstOrDefaultAsync();
                if (category == null) continue;

                var quiz = new Quiz
                {
                    Title = qDef.Title,
                    Description = qDef.Description,
                    CategoryId = category.Id,
                    OwnerId = author.Id,
                    Visibility = QuizVisibility.Public,
                    Duration = qDef.Duration,
                    MaxAttempts = qDef.MaxAttempts,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-qDef.DaysAgo)
                };
                context.Quizzes.Add(quiz);
                await context.SaveChangesAsync();

                var order = 1;
                foreach (var quest in qDef.Questions)
                {
                    var question = new Question
                    {
                        OwnerId = author.Id,
                        CategoryId = category.Id,
                        IsActive = true,
                        CreatedAt = quiz.CreatedAt
                    };
                    context.Questions.Add(question);
                    await context.SaveChangesAsync();

                    var version = new QuestionVersion
                    {
                        QuestionId = question.Id,
                        VersionNumber = 1,
                        Content = quest.Content,
                        QuestionType = quest.Type,
                        CreatedAt = quiz.CreatedAt
                    };
                    context.QuestionVersions.Add(version);
                    await context.SaveChangesAsync();

                    question.CurrentVersionId = version.Id;
                    await context.SaveChangesAsync();

                    foreach (var ans in quest.Answers)
                    {
                        context.Answers.Add(new Answer
                        {
                            QuestionVersionId = version.Id,
                            Content = ans.Item1,
                            IsCorrect = ans.Item2
                        });
                    }
                    await context.SaveChangesAsync();

                    context.QuizQuestions.Add(new QuizQuestion
                    {
                        QuizId = quiz.Id,
                        QuestionId = question.Id,
                        QuestionVersionId = version.Id,
                        Order = order++
                    });
                }
                await context.SaveChangesAsync();
            }
        }
    }
}

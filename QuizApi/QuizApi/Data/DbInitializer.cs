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
        }
    }
}

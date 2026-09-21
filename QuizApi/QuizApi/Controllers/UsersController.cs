using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Users;
using QuizApi.Models;

namespace QuizApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<PagedResult<UserResponse>>> GetAll([FromQuery] UserQueryParameters query)
        {
            var usersQuery = _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .AsNoTracking();

            // Search filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim().ToLower();
                usersQuery = usersQuery.Where(u =>
                    u.FirstName.ToLower().Contains(search) ||
                    u.LastName.ToLower().Contains(search) ||
                    (u.DisplayName != null && u.DisplayName.ToLower().Contains(search)) ||
                    u.Email.ToLower().Contains(search) ||
                    u.UserName.ToLower().Contains(search) ||
                    (u.PhoneNumber != null && u.PhoneNumber.Contains(search))
                );
            }

            // Role filter (only Admin and User are valid roles)
            if (!string.IsNullOrWhiteSpace(query.Role) && !query.Role.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var targetRole = string.Equals(query.Role.Trim(), "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";
                usersQuery = usersQuery.Where(u => u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == targetRole));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                var status = query.Status.Trim().ToLowerInvariant();
                switch (status)
                {
                    case "active":
                        usersQuery = usersQuery.Where(u => !u.IsDeleted && u.IsActive);
                        break;
                    case "inactive":
                        usersQuery = usersQuery.Where(u => !u.IsDeleted && !u.IsActive);
                        break;
                    case "deleted":
                        usersQuery = usersQuery.Where(u => u.IsDeleted);
                        break;
                    case "all":
                        // All users
                        break;
                }
            }

            // Sorting
            var sortField = query.SortBy?.Trim().ToLowerInvariant() ?? "id";
            var isAsc = query.SortDirection?.Equals("asc", StringComparison.OrdinalIgnoreCase) ?? false;

            usersQuery = sortField switch
            {
                "name" => isAsc ? usersQuery.OrderBy(u => u.DisplayName) : usersQuery.OrderByDescending(u => u.DisplayName),
                "email" => isAsc ? usersQuery.OrderBy(u => u.Email) : usersQuery.OrderByDescending(u => u.Email),
                "username" => isAsc ? usersQuery.OrderBy(u => u.UserName) : usersQuery.OrderByDescending(u => u.UserName),
                "role" => isAsc
                    ? usersQuery.OrderBy(u => u.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.Name).FirstOrDefault())
                    : usersQuery.OrderByDescending(u => u.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.Name).FirstOrDefault()),
                "status" => isAsc
                    ? usersQuery.OrderBy(u => u.IsDeleted).ThenBy(u => u.IsActive)
                    : usersQuery.OrderByDescending(u => u.IsDeleted).ThenByDescending(u => u.IsActive),
                "createdat" => isAsc ? usersQuery.OrderBy(u => u.CreatedAt) : usersQuery.OrderByDescending(u => u.CreatedAt),
                _ => isAsc ? usersQuery.OrderBy(u => u.Id) : usersQuery.OrderByDescending(u => u.Id)
            };

            var totalCount = await usersQuery.CountAsync();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var users = await usersQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = users.Select(MapToUserResponse).ToList();

            return Ok(new PagedResult<UserResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        // GET: api/users/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<UserStatisticsResponse>> GetStatistics()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.IsActive);
            var inactiveUsers = await _context.Users.CountAsync(u => !u.IsDeleted && !u.IsActive);
            var deletedUsers = await _context.Users.CountAsync(u => u.IsDeleted);
            var adminUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Admin"));
            var standardUsers = await _context.Users.CountAsync(u => !u.IsDeleted && !u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Admin"));

            return Ok(new UserStatisticsResponse
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = inactiveUsers,
                DeletedUsers = deletedUsers,
                AdminUsers = adminUsers,
                StandardUsers = standardUsers
            });
        }

        // GET: api/users/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserResponse>> GetById(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(MapToUserResponse(user));
        }

        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request)
        {
            var emailLower = request.Email.Trim().ToLowerInvariant();
            var usernameLower = request.UserName.Trim().ToLowerInvariant();

            var emailExists = await _context.Users.AnyAsync(x => x.Email.ToLower() == emailLower);
            if (emailExists)
            {
                return Conflict(new
                {
                    message = "Email is already registered."
                });
            }

            var usernameExists = await _context.Users.AnyAsync(x => x.UserName.ToLower() == usernameLower);
            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username is already taken."
                });
            }

            // Role assignment - only Admin and User are allowed
            var roleName = string.Equals(request.Role?.Trim(), "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role == null)
            {
                role = new Role
                {
                    Name = roleName,
                    Description = roleName == "Admin" ? "Administrator with full system privileges" : "Standard student/learner user",
                    IsActive = true
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            var rawPassword = string.IsNullOrWhiteSpace(request.Password) ? "User@123456" : request.Password;
            var displayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? $"{request.FirstName.Trim()} {request.LastName.Trim()}".Trim()
                : request.DisplayName.Trim();

            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                DisplayName = displayName,
                Email = emailLower,
                UserName = usernameLower,
                PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
                DateOfBirth = request.DateOfBirth,
                Avatar = request.Avatar,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword),
                IsActive = request.IsActive,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
            await _context.SaveChangesAsync();

            var createdUser = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstAsync(u => u.Id == user.Id);

            var response = MapToUserResponse(createdUser);

            return CreatedAtAction(
                nameof(GetById),
                new { id = user.Id },
                response
            );
        }

        // PUT: api/users/1
        [HttpPut("{id:int}")]
        public async Task<ActionResult<UserResponse>> Update(int id, [FromBody] UpdateUserRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var emailLower = request.Email.Trim().ToLowerInvariant();
            var emailExists = await _context.Users.AnyAsync(x => x.Email.ToLower() == emailLower && x.Id != id);
            if (emailExists)
            {
                return Conflict(new
                {
                    message = "Email is already registered by another user."
                });
            }

            var displayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? $"{request.FirstName.Trim()} {request.LastName.Trim()}".Trim()
                : request.DisplayName.Trim();

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.DisplayName = displayName;
            user.Email = emailLower;
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            user.DateOfBirth = request.DateOfBirth;
            user.Avatar = request.Avatar;
            user.IsActive = request.IsActive;

            // If user was soft-deleted and is marked active, restore soft delete
            if (request.IsActive && user.IsDeleted)
            {
                user.IsDeleted = false;
                user.DeletedAt = null;
            }

            // Optional password update
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            // Update role if specified
            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var roleName = string.Equals(request.Role.Trim(), "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                if (role == null)
                {
                    role = new Role
                    {
                        Name = roleName,
                        Description = roleName == "Admin" ? "Administrator with full system privileges" : "Standard student/learner user",
                        IsActive = true
                    };
                    _context.Roles.Add(role);
                    await _context.SaveChangesAsync();
                }

                // Check if user already has exactly this role to avoid duplicate key tracking error in EF Core
                var currentRoleIds = user.UserRoles.Select(ur => ur.RoleId).ToHashSet();
                if (currentRoleIds.Count != 1 || !currentRoleIds.Contains(role.Id))
                {
                    _context.UserRoles.RemoveRange(user.UserRoles);
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    });
                }
            }

            await _context.SaveChangesAsync();

            var updatedUser = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstAsync(u => u.Id == id);

            return Ok(MapToUserResponse(updatedUser));
        }

        // DELETE: api/users/1 (Soft delete)
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<UserResponse>> Delete(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (!user.IsDeleted)
            {
                user.IsDeleted = true;
                user.DeletedAt = DateTime.UtcNow;
                user.IsActive = false;
                await _context.SaveChangesAsync();
            }

            return Ok(MapToUserResponse(user));
        }

        // POST: api/users/1/restore (Restore soft-deleted user)
        [HttpPost("{id:int}/restore")]
        public async Task<ActionResult<UserResponse>> Restore(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (user.IsDeleted)
            {
                user.IsDeleted = false;
                user.DeletedAt = null;
                user.IsActive = true;
                await _context.SaveChangesAsync();
            }

            return Ok(MapToUserResponse(user));
        }

        // PATCH: api/users/1/status
        [HttpPatch("{id:int}/status")]
        public async Task<ActionResult<UserResponse>> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.IsActive = request.IsActive;
            if (request.IsActive && user.IsDeleted)
            {
                user.IsDeleted = false;
                user.DeletedAt = null;
            }

            await _context.SaveChangesAsync();

            return Ok(MapToUserResponse(user));
        }

        private static UserResponse MapToUserResponse(User u)
        {
            var roleNames = u.UserRoles != null
                ? u.UserRoles
                    .Where(ur => ur.Role != null)
                    .Select(ur => ur.Role!.Name)
                    .Distinct()
                    .ToList()
                : new List<string>();

            var primaryRole = roleNames.Contains("Admin") ? "Admin" : "User";

            return new UserResponse
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                DisplayName = string.IsNullOrWhiteSpace(u.DisplayName) ? $"{u.FirstName} {u.LastName}".Trim() : u.DisplayName,
                Email = u.Email,
                UserName = u.UserName,
                PhoneNumber = u.PhoneNumber,
                DateOfBirth = u.DateOfBirth,
                Avatar = u.Avatar,
                IsActive = u.IsActive,
                IsDeleted = u.IsDeleted,
                DeletedAt = u.DeletedAt,
                CreatedAt = u.CreatedAt,
                Role = primaryRole,
                Roles = roleNames
            };
        }
    }
}

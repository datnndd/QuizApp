using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizApi.DTOs.Auth;
using QuizApi.Services;

namespace QuizApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _authService.RegisterAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserInfoResponse>> GetCurrentUser()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "User identifier missing from token." });
            }

            var userInfo = await _authService.GetUserInfoAsync(userId);
            if (userInfo == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(userInfo);
        }

        [Authorize(Roles = "User")]
        [HttpGet("user-only")]
        public IActionResult UserOnlyEndpoint()
        {
            return Ok(new
            {
                message = "Access granted to User role endpoint.",
                userName = User.FindFirstValue(ClaimTypes.Name)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin-only")]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok(new
            {
                message = "Access granted to Admin role endpoint.",
                userName = User.FindFirstValue(ClaimTypes.Name)
            });
        }
    }
}

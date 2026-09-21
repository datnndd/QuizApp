using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Quizzes;
using QuizApi.Models;

namespace QuizApi.Controllers
{
    [ApiController]
    [Route("api/quizzes")]
    public class QuizzesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizzesController(AppDbContext context)
        {
            _context = context;
        }


        // GET api/quizzes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizResponse>>> GetAll()
        {
            var quizzes = await _context.Quizzes
                .AsNoTracking()
                .Where(x => x.IsActive)
                .Select(x => new QuizResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    Duration = x.Duration,
                    IsActive = x.IsActive,
                    UserId = x.UserId,
                    OwnerName = x.User.DisplayName
                })
                .ToListAsync();

            return Ok(quizzes);
        }


        // GET api/quizzes/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<QuizResponse>> GetById(int id)
        {
            var quiz = await _context.Quizzes
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new QuizResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    Duration = x.Duration,
                    IsActive = x.IsActive,
                    UserId = x.UserId,
                    OwnerName = x.User.DisplayName
                })
                .FirstOrDefaultAsync<QuizResponse>();

            if (quiz is null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy quiz."
                });
            }

            return Ok(quiz);
        }


        // GET api/quizzes/user/1
        [HttpGet("user/{userId:int}")]
        public async Task<ActionResult<IEnumerable<QuizResponse>>> GetByUser(
            int userId)
        {
            var quizzes = await _context.Quizzes
                .AsNoTracking()
                .Where(x =>
                    x.UserId == userId &&
                    x.IsActive)
                .Select(x => new QuizResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    Duration = x.Duration,
                    IsActive = x.IsActive,
                    UserId = x.UserId,
                    OwnerName = x.User.DisplayName
                })
                .ToListAsync();

            return Ok(quizzes);
        }


        // POST api/quizzes
        [HttpPost]
        public async Task<ActionResult<QuizResponse>> Create(
            CreateQuizRequest request)
        {
            var userExists = await _context.Users
                .AnyAsync(x =>
                    x.Id == request.UserId &&
                    x.IsActive);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User không tồn tại."
                });
            }


            var quiz = new Quiz
            {
                Title = request.Title,
                Description = request.Description,
                Duration = request.Duration,
                UserId = request.UserId,
                IsActive = true
            };


            _context.Quizzes.Add(quiz);

            await _context.SaveChangesAsync();


            return CreatedAtAction(
                nameof(GetById),
                new { id = quiz.Id },
                new QuizResponse
                {
                    Id = quiz.Id,
                    Title = quiz.Title,
                    Description = quiz.Description,
                    Duration = quiz.Duration,
                    IsActive = quiz.IsActive,
                    UserId = quiz.UserId
                }
            );
        }


        // PUT api/quizzes/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateQuizRequest request)
        {
            var quiz = await _context.Quizzes
                .FirstOrDefaultAsync(x => x.Id == id);

            if (quiz is null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy quiz."
                });
            }


            quiz.Title = request.Title;
            quiz.Description = request.Description;
            quiz.Duration = request.Duration;
            quiz.IsActive = request.IsActive;


            await _context.SaveChangesAsync();

            return NoContent();
        }


        // DELETE api/quizzes/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var quiz = await _context.Quizzes
                .FirstOrDefaultAsync(x => x.Id == id);

            if (quiz is null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy quiz."
                });
            }


            // Soft delete
            quiz.IsActive = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

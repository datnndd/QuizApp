using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Categories;

namespace QuizApi.Controllers;

[Authorize]
[ApiController]
[Route("api/categories")]
public class CategoriesController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var categories = await context.Categories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new CategoryResponse { Id = x.Id, Name = x.Name })
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }
}

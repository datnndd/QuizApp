using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Data;
using QuizApi.DTOs.Categories;
using QuizApi.Models;

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

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var trimmedName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return BadRequest(new { message = "Category name cannot be empty." });
        }

        // Case-insensitive duplicate check
        var existing = await context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);

        if (existing != null)
        {
            if (!existing.IsActive)
            {
                existing.IsActive = true;
                await context.SaveChangesAsync(cancellationToken);
            }
            return Ok(new CategoryResponse { Id = existing.Id, Name = existing.Name });
        }

        var category = new Category
        {
            Name = trimmedName,
            IsActive = true
        };

        context.Categories.Add(category);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = category.Id }, new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name
        });
    }
}


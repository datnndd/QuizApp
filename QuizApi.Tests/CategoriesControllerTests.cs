using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizApi.Controllers;
using QuizApi.Data;
using QuizApi.DTOs.Categories;
using QuizApi.Models;

namespace QuizApi.Tests;

public class CategoriesControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsActiveCategories()
    {
        await using var context = CreateContext();
        var controller = new CategoriesController(context);

        var result = await controller.GetAll(CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var categories = Assert.IsAssignableFrom<IEnumerable<CategoryResponse>>(ok.Value);

        Assert.NotEmpty(categories);
    }

    [Fact]
    public async Task Create_NewCategory_ReturnsCreatedCategory()
    {
        await using var context = CreateContext();
        var controller = new CategoriesController(context);

        var request = new CreateCategoryRequest { Name = "Quantum Computing" };
        var result = await controller.Create(request, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<CategoryResponse>(created.Value);

        Assert.True(response.Id > 0);
        Assert.Equal("Quantum Computing", response.Name);

        var inDb = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Quantum Computing");
        Assert.NotNull(inDb);
        Assert.True(inDb.IsActive);
    }

    [Fact]
    public async Task Create_ExistingCategoryCaseInsensitive_ReturnsExistingWithoutDuplicate()
    {
        await using var context = CreateContext();
        var controller = new CategoriesController(context);

        // "Mathematics" already seeded in AppDbContext.HasData
        var request = new CreateCategoryRequest { Name = "mathematics" };
        var result = await controller.Create(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CategoryResponse>(ok.Value);

        Assert.Equal(1, response.Id);
        Assert.Equal("Mathematics", response.Name);
    }

    [Fact]
    public async Task Create_BlankName_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new CategoriesController(context);

        var request = new CreateCategoryRequest { Name = "   " };
        var result = await controller.Create(request, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

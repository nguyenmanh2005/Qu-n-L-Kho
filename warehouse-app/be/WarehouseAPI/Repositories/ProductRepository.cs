using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IEnumerable<Product>> GetAllAsync(string? search, string? category)
    {
        var q = db.Products.Include(p => p.Supplier).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            q = q.Where(p => p.Name.Contains(search) || p.SKU.Contains(search));

        if (!string.IsNullOrEmpty(category))
            q = q.Where(p => p.Category == category);

        return await q.OrderBy(p => p.Name).ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetLowStockAsync()
        => await db.Products
            .Where(p => p.CurrentStock <= p.MinStock)
            .OrderBy(p => p.CurrentStock)
            .ToListAsync();

    public async Task<Product?> GetByIdAsync(int id)
        => await db.Products
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Product> CreateAsync(Product product)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync();
        return product;
    }

    public async Task DeleteAsync(Product product)
    {
        db.Products.Remove(product);
        await db.SaveChangesAsync();
    }

    public async Task<bool> SKUExistsAsync(string sku, int? excludeId = null)
        => await db.Products.AnyAsync(p => p.SKU == sku && p.Id != excludeId);
}
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync(string? search, string? category);
    Task<IEnumerable<Product>> GetLowStockAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Product product);
    Task<bool> SKUExistsAsync(string sku, int? excludeId = null);
}
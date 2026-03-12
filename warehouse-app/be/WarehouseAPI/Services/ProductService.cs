using WarehouseAPI.DTOs;
using WarehouseAPI.Entities;
using WarehouseAPI.Repositories;

namespace WarehouseAPI.Services;

public class ProductService(IProductRepository repo) : IProductService
{
    public async Task<IEnumerable<ProductResponseDto>> GetAllAsync(string? search, string? category)
    {
        var products = await repo.GetAllAsync(search, category);
        return products.Select(ToDto);
    }

    public async Task<IEnumerable<ProductResponseDto>> GetLowStockAsync()
    {
        var products = await repo.GetLowStockAsync();
        return products.Select(ToDto);
    }

    public async Task<ProductResponseDto?> GetByIdAsync(int id)
    {
        var product = await repo.GetByIdAsync(id);
        return product is null ? null : ToDto(product);
    }

    public async Task<ProductResponseDto> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name         = dto.Name,
            SKU          = dto.SKU,
            Category     = dto.Category,
            Unit         = dto.Unit,
            CostPrice    = dto.CostPrice,
            SellingPrice = dto.SellingPrice,
            MinStock     = dto.MinStock,
            SupplierId   = dto.SupplierId,
            CurrentStock = 0,
        };
        var created = await repo.CreateAsync(product);
        return ToDto(created);
    }

    public async Task<ProductResponseDto?> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await repo.GetByIdAsync(id);
        if (product is null) return null;

        product.Name         = dto.Name;
        product.SKU          = dto.SKU;
        product.Category     = dto.Category;
        product.Unit         = dto.Unit;
        product.CostPrice    = dto.CostPrice;
        product.SellingPrice = dto.SellingPrice;
        product.MinStock     = dto.MinStock;
        product.CurrentStock = dto.CurrentStock;
        product.SupplierId   = dto.SupplierId;

        var updated = await repo.UpdateAsync(product);
        return ToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await repo.GetByIdAsync(id);
        if (product is null) return false;
        await repo.DeleteAsync(product);
        return true;
    }

    private static ProductResponseDto ToDto(Product p) => new()
    {
        Id           = p.Id,
        Name         = p.Name,
        SKU          = p.SKU,
        Category     = p.Category,
        Unit         = p.Unit,
        CostPrice    = p.CostPrice,
        SellingPrice = p.SellingPrice,
        CurrentStock = p.CurrentStock,
        MinStock     = p.MinStock,
        SupplierId   = p.SupplierId,
        SupplierName = p.Supplier?.Name,
        CreatedAt    = p.CreatedAt,
    };
}
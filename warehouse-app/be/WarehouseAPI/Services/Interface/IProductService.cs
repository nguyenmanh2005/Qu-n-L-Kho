using WarehouseAPI.DTOs;

namespace WarehouseAPI.Services;

public interface IProductService
{
    Task<IEnumerable<ProductResponseDto>> GetAllAsync(string? search, string? category);
    Task<IEnumerable<ProductResponseDto>> GetLowStockAsync();
    Task<ProductResponseDto?> GetByIdAsync(int id);
    Task<ProductResponseDto> CreateAsync(CreateProductDto dto);
    Task<ProductResponseDto?> UpdateAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteAsync(int id);
}
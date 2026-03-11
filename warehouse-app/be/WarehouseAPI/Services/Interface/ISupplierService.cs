using WarehouseAPI.DTOs;

namespace WarehouseAPI.Services;

public interface ISupplierService
{
    Task<IEnumerable<SupplierResponseDto>> GetAllAsync();
    Task<SupplierResponseDto?> GetByIdAsync(int id);
    Task<SupplierResponseDto> CreateAsync(CreateSupplierDto dto);
    Task<SupplierResponseDto?> UpdateAsync(int id, UpdateSupplierDto dto);
    Task<bool> DeleteAsync(int id);
}
using WarehouseAPI.DTOs;
using WarehouseAPI.Entities;
using WarehouseAPI.Repositories;

namespace WarehouseAPI.Services;

public class SupplierService(ISupplierRepository repo) : ISupplierService
{
    public async Task<IEnumerable<SupplierResponseDto>> GetAllAsync()
    {
        var suppliers = await repo.GetAllAsync();
        return suppliers.Select(ToDto);
    }

    public async Task<SupplierResponseDto?> GetByIdAsync(int id)
    {
        var supplier = await repo.GetByIdAsync(id);
        return supplier is null ? null : ToDto(supplier);
    }

    public async Task<SupplierResponseDto> CreateAsync(CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name    = dto.Name,
            Phone   = dto.Phone,
            Email   = dto.Email,
            Address = dto.Address,
        };
        var created = await repo.CreateAsync(supplier);
        return ToDto(created);
    }

    public async Task<SupplierResponseDto?> UpdateAsync(int id, UpdateSupplierDto dto)
    {
        var supplier = await repo.GetByIdAsync(id);
        if (supplier is null) return null;

        supplier.Name    = dto.Name;
        supplier.Phone   = dto.Phone;
        supplier.Email   = dto.Email;
        supplier.Address = dto.Address;

        var updated = await repo.UpdateAsync(supplier);
        return ToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var supplier = await repo.GetByIdAsync(id);
        if (supplier is null) return false;
        await repo.SoftDeleteAsync(supplier);
        return true;
    }

    private static SupplierResponseDto ToDto(Supplier s) => new()
    {
        Id        = s.Id,
        Name      = s.Name,
        Phone     = s.Phone,
        Email     = s.Email,
        Address   = s.Address,
        IsActive  = s.IsActive,
        CreatedAt = s.CreatedAt,
    };
}
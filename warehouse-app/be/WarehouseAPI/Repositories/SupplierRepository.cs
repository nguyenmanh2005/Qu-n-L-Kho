using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public class SupplierRepository(AppDbContext db) : ISupplierRepository
{
    public async Task<IEnumerable<Supplier>> GetAllAsync()
        => await db.Suppliers
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync();

    public async Task<Supplier?> GetByIdAsync(int id)
        => await db.Suppliers.FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

    public async Task<Supplier> CreateAsync(Supplier supplier)
    {
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync();
        return supplier;
    }

    public async Task<Supplier> UpdateAsync(Supplier supplier)
    {
        db.Suppliers.Update(supplier);
        await db.SaveChangesAsync();
        return supplier;
    }

    public async Task SoftDeleteAsync(Supplier supplier)
    {
        supplier.IsActive = false;
        db.Suppliers.Update(supplier);
        await db.SaveChangesAsync();
    }
}
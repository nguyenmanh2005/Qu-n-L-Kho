using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public class InventoryRepository(AppDbContext db) : IInventoryRepository
{
    public async Task<IEnumerable<InventoryTransaction>> GetHistoryAsync(int? productId, string? type)
    {
        var q = db.InventoryTransactions
            .Include(t => t.Product)
            .AsQueryable();

        if (productId.HasValue)
            q = q.Where(t => t.ProductId == productId);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TransactionType>(type, out var t2))
            q = q.Where(t => t.Type == t2);

        return await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<InventoryTransaction> CreateAsync(InventoryTransaction transaction)
    {
        db.InventoryTransactions.Add(transaction);
        await db.SaveChangesAsync();
        return transaction;
    }
}
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public interface IInventoryRepository
{
    Task<IEnumerable<InventoryTransaction>> GetHistoryAsync(int? productId, string? type);
    Task<InventoryTransaction> CreateAsync(InventoryTransaction transaction);
}
using WarehouseAPI.DTOs;

namespace WarehouseAPI.Services;

public interface IInventoryService
{
    Task<IEnumerable<TransactionResponseDto>> GetHistoryAsync(int? productId, string? type);
    Task<(bool Success, string Message, int NewStock)> ImportAsync(ImportExportDto dto);
    Task<(bool Success, string Message, int NewStock)> ExportAsync(ImportExportDto dto);
}
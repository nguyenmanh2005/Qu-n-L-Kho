using WarehouseAPI.DTOs;
using WarehouseAPI.Entities;
using WarehouseAPI.Repositories;

namespace WarehouseAPI.Services;

public class InventoryService(
    IInventoryRepository inventoryRepo,
    IProductRepository productRepo) : IInventoryService
{
    public async Task<IEnumerable<TransactionResponseDto>> GetHistoryAsync(int? productId, string? type)
    {
        var transactions = await inventoryRepo.GetHistoryAsync(productId, type);
        return transactions.Select(ToDto);
    }

    public async Task<(bool Success, string Message, int NewStock)> ImportAsync(ImportExportDto dto)
    {
        var product = await productRepo.GetByIdAsync(dto.ProductId);
        if (product is null) return (false, "Sản phẩm không tồn tại", 0);
        if (dto.Quantity <= 0) return (false, "Số lượng phải lớn hơn 0", 0);

        var transaction = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            Type      = TransactionType.Import,
            Quantity  = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            Note      = dto.Note,
            CreatedBy = dto.CreatedBy,
        };

        await inventoryRepo.CreateAsync(transaction);

        product.CurrentStock += dto.Quantity;
        await productRepo.UpdateAsync(product);

        return (true, "Nhập kho thành công", product.CurrentStock);
    }

    public async Task<(bool Success, string Message, int NewStock)> ExportAsync(ImportExportDto dto)
    {
        var product = await productRepo.GetByIdAsync(dto.ProductId);
        if (product is null) return (false, "Sản phẩm không tồn tại", 0);
        if (dto.Quantity <= 0) return (false, "Số lượng phải lớn hơn 0", 0);
        if (product.CurrentStock < dto.Quantity)
            return (false, $"Không đủ hàng. Tồn kho hiện tại: {product.CurrentStock}", product.CurrentStock);

        var transaction = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            Type      = TransactionType.Export,
            Quantity  = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            Note      = dto.Note,
            CreatedBy = dto.CreatedBy,
        };

        await inventoryRepo.CreateAsync(transaction);

        product.CurrentStock -= dto.Quantity;
        await productRepo.UpdateAsync(product);

        return (true, "Xuất kho thành công", product.CurrentStock);
    }

    private static TransactionResponseDto ToDto(InventoryTransaction t) => new()
    {
        Id          = t.Id,
        ProductId   = t.ProductId,
        ProductName = t.Product.Name,
        ProductSKU  = t.Product.SKU,
        ProductUnit = t.Product.Unit,
        Type        = t.Type.ToString(),
        Quantity    = t.Quantity,
        UnitPrice   = t.UnitPrice,
        TotalPrice  = t.Quantity * t.UnitPrice,
        Note        = t.Note,
        CreatedBy   = t.CreatedBy,
        CreatedAt   = t.CreatedAt,
    };
}
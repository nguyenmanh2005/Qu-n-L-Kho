using WarehouseAPI.Data;
using WarehouseAPI.DTOs;
using WarehouseAPI.Entities;
using WarehouseAPI.Repositories;

namespace WarehouseAPI.Services;

public class OrderService(IOrderRepository repo, AppDbContext db) : IOrderService
{
    public async Task<IEnumerable<OrderResponseDto>> GetAllAsync()
    {
        var orders = await repo.GetAllAsync();
        return orders.Select(MapToDto);
    }

    public async Task<OrderResponseDto?> GetByIdAsync(int id)
    {
        var order = await repo.GetByIdAsync(id);
        return order is null ? null : MapToDto(order);
    }

    public async Task<OrderResponseDto> CreateAsync(CreateOrderDto dto)
    {
        var order = new Order
        {
            SupplierId  = dto.SupplierId,
            Note        = dto.Note ?? "",
            TotalAmount = dto.Items.Sum(i => i.Quantity * i.UnitPrice),
            Items       = dto.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Quantity  = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
        };

        await repo.CreateAsync(order);
        var created = await repo.GetByIdAsync(order.Id);
        return MapToDto(created!);
    }

    public async Task<OrderResponseDto?> UpdateStatusAsync(int id, string status)
    {
        if (!Enum.TryParse<OrderStatus>(status, out var newStatus))
            return null;

        var order = await repo.GetByIdAsync(id);
        if (order is null) return null;

        // Khi nhân viên xác nhận → tự động nhập kho
        if (newStatus == OrderStatus.Confirmed && order.Status == OrderStatus.Pending)
        {
            foreach (var item in order.Items)
            {
                var product = await db.Products.FindAsync(item.ProductId);
                if (product is not null)
                {
                    product.CurrentStock += item.Quantity;

                    db.InventoryTransactions.Add(new InventoryTransaction
                    {
                        ProductId = item.ProductId,
                        Type      = TransactionType.Import,
                        Quantity  = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Note      = $"Nhập từ đơn hàng #{order.Id}",
                        CreatedBy = "System",
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        order.Status = newStatus;
        await repo.UpdateAsync(order);
        await db.SaveChangesAsync();
        return MapToDto(order);
    }

    private static OrderResponseDto MapToDto(Order o) => new()
    {
        Id           = o.Id,
        SupplierId   = o.SupplierId,
        SupplierName = o.Supplier?.Name,
        Status       = o.Status.ToString(),
        Note         = o.Note,
        TotalAmount  = o.TotalAmount,
        CreatedAt    = o.CreatedAt,
        Items        = o.Items.Select(i => new OrderItemResponseDto
        {
            ProductId   = i.ProductId,
            ProductName = i.Product?.Name,
            ProductUnit = i.Product?.Unit,
            Quantity    = i.Quantity,
            UnitPrice   = i.UnitPrice,
        }).ToList(),
    };
    public async Task<OrderResponseDto?> UpdateAsync(int id, CreateOrderDto dto)
{
    var order = await repo.GetByIdAsync(id);
    if (order is null || order.Status != OrderStatus.Pending) return null;

    // Xóa items cũ
    db.OrderItems.RemoveRange(order.Items);

    // Cập nhật thông tin
    order.SupplierId  = dto.SupplierId;
    order.Note        = dto.Note ?? "";
    order.TotalAmount = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
    order.Items       = dto.Items.Select(i => new OrderItem
    {
        ProductId = i.ProductId,
        Quantity  = i.Quantity,
        UnitPrice = i.UnitPrice,
    }).ToList();

    await repo.UpdateAsync(order);
    await db.SaveChangesAsync();

    var updated = await repo.GetByIdAsync(id);
    return MapToDto(updated!);
}
}
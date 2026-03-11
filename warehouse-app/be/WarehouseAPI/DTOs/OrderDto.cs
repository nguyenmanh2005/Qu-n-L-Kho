namespace WarehouseAPI.DTOs;

public class CreateOrderDto
{
    public int? SupplierId { get; set; }
    public string Note { get; set; } = "";
    public List<CreateOrderItemDto> Items { get; set; } = [];
}

public class CreateOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = "";
}

public class OrderResponseDto
{
    public int Id { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string Status { get; set; } = "";
    public string Note { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemResponseDto> Items { get; set; } = [];
}

public class OrderItemResponseDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string ProductUnit { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
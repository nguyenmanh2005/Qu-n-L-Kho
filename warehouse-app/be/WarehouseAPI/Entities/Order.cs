namespace WarehouseAPI.Entities;

public enum OrderStatus { Pending, Confirmed, Completed, Rejected }

public class Order
{
    public int Id { get; set; }
    public int? SupplierId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string Note { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Supplier? Supplier { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
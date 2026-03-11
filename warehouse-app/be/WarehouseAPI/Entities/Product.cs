namespace WarehouseAPI.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string SKU { get; set; } = "";
    public string Category { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int CurrentStock { get; set; }
    public int MinStock { get; set; }
    public int? SupplierId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Supplier? Supplier { get; set; }
    public ICollection<InventoryTransaction> Transactions { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
namespace WarehouseAPI.Entities;

public enum TransactionType { Import, Export }

public class InventoryTransaction
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public TransactionType Type { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string Note { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
}
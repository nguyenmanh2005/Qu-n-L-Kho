namespace WarehouseAPI.DTOs;

public class ImportExportDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string Note { get; set; } = "";
    public string CreatedBy { get; set; } = "";
}

public class TransactionResponseDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string ProductSKU { get; set; } = "";
    public string ProductUnit { get; set; } = "";
    public string Type { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class InventoryResultDto
{
    public string Message { get; set; } = "";
    public int NewStock { get; set; }
}
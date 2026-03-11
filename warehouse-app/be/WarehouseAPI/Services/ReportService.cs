using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Services;

public class ReportService(AppDbContext db) : IReportService
{
    public async Task<object> GetStockReportAsync()
    {
        var products = await db.Products.Include(p => p.Supplier).ToListAsync();
        return new
        {
            total      = products.Count,
            lowStock   = products.Count(p => p.CurrentStock <= p.MinStock),
            outOfStock = products.Count(p => p.CurrentStock == 0),
            totalValue = products.Sum(p => p.CurrentStock * p.CostPrice),
            items      = products.Select(p => new
            {
                p.Id, p.Name, p.SKU, p.Category, p.Unit,
                p.CurrentStock, p.MinStock, p.CostPrice, p.SellingPrice,
                supplier = p.Supplier == null ? null : new { p.Supplier.Id, p.Supplier.Name },
            }),
        };
    }

    public async Task<object> GetTransactionReportAsync(DateTime? from, DateTime? to)
    {
        var q = db.InventoryTransactions.Include(t => t.Product).AsQueryable();
        if (from.HasValue) q = q.Where(t => t.CreatedAt >= from);
        if (to.HasValue)   q = q.Where(t => t.CreatedAt <= to);

        var list = await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return new
        {
            totalImport      = list.Where(t => t.Type == TransactionType.Import).Sum(t => t.Quantity),
            totalExport      = list.Where(t => t.Type == TransactionType.Export).Sum(t => t.Quantity),
            totalImportValue = list.Where(t => t.Type == TransactionType.Import).Sum(t => t.Quantity * t.UnitPrice),
            totalExportValue = list.Where(t => t.Type == TransactionType.Export).Sum(t => t.Quantity * t.UnitPrice),
            items = list.Select(t => new
            {
                t.Id, t.Type, t.Quantity, t.UnitPrice,
                totalPrice = t.Quantity * t.UnitPrice,
                t.Note, t.CreatedBy, t.CreatedAt,
                product = new { t.Product.Name, t.Product.SKU, t.Product.Unit },
            }),
        };
    }

    public async Task<object> GetDashboardByMonthAsync(int year, int month)
    {
        var from = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var to   = from.AddMonths(1).AddTicks(-1);

        var transactions = await db.InventoryTransactions
            .Include(t => t.Product)
            .Where(t => t.CreatedAt >= from && t.CreatedAt <= to)
            .ToListAsync();

        var orders = await db.Orders
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var dailyImport = transactions
            .Where(t => t.Type == TransactionType.Import)
            .GroupBy(t => t.CreatedAt.Day)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Quantity));

        var dailyExport = transactions
            .Where(t => t.Type == TransactionType.Export)
            .GroupBy(t => t.CreatedAt.Day)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Quantity));

        var dailyImportValue = transactions
            .Where(t => t.Type == TransactionType.Import)
            .GroupBy(t => t.CreatedAt.Day)
            .ToDictionary(g => g.Key, g => g.Sum(t => (decimal)t.Quantity * t.UnitPrice));

        var dailyExportValue = transactions
            .Where(t => t.Type == TransactionType.Export)
            .GroupBy(t => t.CreatedAt.Day)
            .ToDictionary(g => g.Key, g => g.Sum(t => (decimal)t.Quantity * t.UnitPrice));

        var daysInMonth = DateTime.DaysInMonth(year, month);
        var daily = Enumerable.Range(1, daysInMonth).Select(day => new
        {
            day,
            label       = $"{day}/{month}",
            import      = dailyImport.GetValueOrDefault(day, 0),
            export      = dailyExport.GetValueOrDefault(day, 0),
            importValue = dailyImportValue.GetValueOrDefault(day, 0m),
            exportValue = dailyExportValue.GetValueOrDefault(day, 0m),
        }).ToList();

        var totalImportValue = transactions
            .Where(t => t.Type == TransactionType.Import)
            .Sum(t => (decimal)t.Quantity * t.UnitPrice);

        var totalExportValue = transactions
            .Where(t => t.Type == TransactionType.Export)
            .Sum(t => (decimal)t.Quantity * t.UnitPrice);

        var totalCostOfGoods = transactions
            .Where(t => t.Type == TransactionType.Export)
            .Sum(t => (decimal)t.Quantity * t.Product.CostPrice);

        var grossProfit = totalExportValue - totalCostOfGoods;
        var netCashFlow = totalExportValue - totalImportValue;

        return new
        {
            year, month,
            totalImport      = transactions.Where(t => t.Type == TransactionType.Import).Sum(t => t.Quantity),
            totalExport      = transactions.Where(t => t.Type == TransactionType.Export).Sum(t => t.Quantity),
            totalImportValue,
            totalExportValue,
            totalCostOfGoods,
            grossProfit,
            netCashFlow,
            totalOrders   = orders.Count,
            pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending),
            daily,
        };
    }
}
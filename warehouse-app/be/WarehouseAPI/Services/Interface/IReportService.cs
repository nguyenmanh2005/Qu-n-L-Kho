namespace WarehouseAPI.Services;

public interface IReportService
{
    Task<object> GetStockReportAsync();
    Task<object> GetTransactionReportAsync(DateTime? from, DateTime? to);
Task<object> GetDashboardByMonthAsync(int year, int month);
}

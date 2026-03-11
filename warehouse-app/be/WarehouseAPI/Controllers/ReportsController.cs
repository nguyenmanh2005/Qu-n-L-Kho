using Microsoft.AspNetCore.Mvc;
using WarehouseAPI.Services;

namespace WarehouseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController(IReportService service) : ControllerBase
{
    [HttpGet("stock")]
    public async Task<IActionResult> GetStockReport()
    {
        var result = await service.GetStockReportAsync();
        return Ok(result);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactionReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var result = await service.GetTransactionReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        var y = year  ?? DateTime.UtcNow.Year;
        var m = month ?? DateTime.UtcNow.Month;
        if (m < 1 || m > 12) return BadRequest(new { message = "Tháng không hợp lệ" });
        var result = await service.GetDashboardByMonthAsync(y, m);
        return Ok(result);
    }
}
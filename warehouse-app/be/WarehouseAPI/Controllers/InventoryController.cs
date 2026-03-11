using Microsoft.AspNetCore.Mvc;
using WarehouseAPI.DTOs;
using WarehouseAPI.Services;

namespace WarehouseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(IInventoryService service) : ControllerBase
{
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int? productId,
        [FromQuery] string? type)
    {
        var result = await service.GetHistoryAsync(productId, type);
        return Ok(result);
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromBody] ImportExportDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (success, message, newStock) = await service.ImportAsync(dto);
        if (!success) return BadRequest(new { message });
        return Ok(new { message, newStock });
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ImportExportDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (success, message, newStock) = await service.ExportAsync(dto);
        if (!success) return BadRequest(new { message });
        return Ok(new { message, newStock });
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WarehouseAPI.DTOs;
using WarehouseAPI.Services;

namespace WarehouseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateOrderDto dto)
    {
        var result = await service.UpdateAsync(id, dto);
        if (result is null)
            return BadRequest(new { message = "Không thể sửa đơn hàng này (chỉ sửa được đơn Pending)" });
        return Ok(result);
    }

    [HttpPut("{id}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        var result = await service.UpdateStatusAsync(id, "Confirmed");
        if (result is null)
            return BadRequest(new { message = "Đơn không tồn tại" });
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var result = await service.UpdateStatusAsync(id, dto.Status);
        if (result is null)
            return BadRequest(new { message = "Trạng thái không hợp lệ hoặc đơn không tồn tại" });
        return Ok(result);
    }
}
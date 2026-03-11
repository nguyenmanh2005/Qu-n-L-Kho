using WarehouseAPI.DTOs;

namespace WarehouseAPI.Services;

public interface IOrderService
{
    Task<IEnumerable<OrderResponseDto>> GetAllAsync();
    Task<OrderResponseDto?> GetByIdAsync(int id);
    Task<OrderResponseDto> CreateAsync(CreateOrderDto dto);
    Task<OrderResponseDto?> UpdateStatusAsync(int id, string status);
    Task<OrderResponseDto?> UpdateAsync(int id, CreateOrderDto dto);
}
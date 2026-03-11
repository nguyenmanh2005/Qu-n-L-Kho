using WarehouseAPI.DTOs;

namespace WarehouseAPI.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
}
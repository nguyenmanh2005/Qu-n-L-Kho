using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.DTOs;
using WarehouseAPI.Services;

namespace WarehouseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService service, AppDbContext db) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Username và password bắt buộc" });

        var result = await service.RegisterAsync(dto);
        if (result is null)
            return Conflict(new { message = "Username đã tồn tại" });

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await service.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu" });

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await service.RefreshAsync(dto.RefreshToken);
        if (result is null)
            return Unauthorized(new { message = "Refresh token không hợp lệ hoặc đã hết hạn" });

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto dto)
    {
        await service.RevokeAsync(dto.RefreshToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var id       = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role     = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var fullName = User.FindFirst("fullName")?.Value;
        return Ok(new { id, username, role, fullName });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new {
                u.Id, u.Username, u.FullName,
                Role = u.Role.ToString(),
                u.IsActive, u.LastLoginAt, u.CreatedAt,
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpPut("users/{id}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.IsActive = !user.IsActive;
        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.IsActive });
    }
}
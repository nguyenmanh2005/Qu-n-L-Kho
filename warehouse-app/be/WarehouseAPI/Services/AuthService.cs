using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WarehouseAPI.Data;
using WarehouseAPI.DTOs;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    private readonly string _secret    = config["Jwt:Secret"]!;
    private readonly string _issuer    = config["Jwt:Issuer"]!;
    private readonly string _audience  = config["Jwt:Audience"]!;
    private readonly int    _accessExp = int.Parse(config["Jwt:AccessTokenExpireMinutes"]!);
    private readonly int    _refreshExp = int.Parse(config["Jwt:RefreshTokenExpireDays"]!);

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Username == dto.Username))
            return null;

        if (!Enum.TryParse<UserRole>(dto.Role, out var role))
            role = UserRole.Staff;

        var user = new User
        {
            Username     = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName     = dto.FullName,
            Role         = role,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return await GenerateTokens(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await GenerateTokens(user);
    }

    public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
    {
        var token = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r =>
                r.Token == refreshToken &&
                !r.IsRevoked &&
                r.ExpiresAt > DateTime.UtcNow);

        if (token is null) return null;

        token.IsRevoked = true;
        await db.SaveChangesAsync();
        return await GenerateTokens(token.User);
    }

    public async Task RevokeAsync(string refreshToken)
    {
        var token = await db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (token is null) return;
        token.IsRevoked = true;
        await db.SaveChangesAsync();
    }

    private async Task<AuthResponseDto> GenerateTokens(User user)
    {
        // Access token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name,           user.Username),
            new Claim(ClaimTypes.Role,           user.Role.ToString()),
            new Claim("fullName",                user.FullName),
        };

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jwt   = new JwtSecurityToken(
            issuer:   _issuer,
            audience: _audience,
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(_accessExp),
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(jwt);

        // Refresh token
        var refreshBytes = new byte[64];
        RandomNumberGenerator.Fill(refreshBytes);
        var refreshToken = Convert.ToBase64String(refreshBytes);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId    = user.Id,
            Token     = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshExp),
        });
        await db.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken  = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn    = _accessExp * 60,
            User = new UserResponseDto
            {
                Id       = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role     = user.Role.ToString(),
            },
        };
    }
}
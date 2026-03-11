namespace WarehouseAPI.DTOs;

public class RegisterDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "Staff";
}

public class LoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class AuthResponseDto
{
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";
    public int ExpiresIn { get; set; }
    public UserResponseDto User { get; set; } = null!;
}

public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = "";
}

public class UserResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "";
}
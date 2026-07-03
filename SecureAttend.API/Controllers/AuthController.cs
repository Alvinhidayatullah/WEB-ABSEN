using Microsoft.AspNetCore.Mvc;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace SecureAttend.API.Controllers
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _context.Set<User>().FirstOrDefault(u => u.Username == req.Username);
            
            if (user == null)
            {
                return Unauthorized(new { message = "ID atau Kata Sandi salah." });
            }

            if (!user.StatusAktif)
            {
                return Unauthorized(new { message = "Akun Anda dinonaktifkan." });
            }

            // 1. Validasi Password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "ID atau Kata Sandi salah." });
            }

            // 2. Buat Token JWT
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwtSecret = _configuration["Jwt:Secret"];
            if (string.IsNullOrEmpty(jwtSecret)) throw new System.Exception("JWT Secret missing");
            var key = System.Text.Encoding.ASCII.GetBytes(jwtSecret);
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, user.Username),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role)
                }),
                Expires = System.DateTime.UtcNow.AddHours(8),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                    new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // 3. Set HttpOnly Cookie
            Response.Cookies.Append("SecureAttend_Session", tokenString, new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = true, // OWASP: Enforce secure flag
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax,
                Expires = System.DateTimeOffset.UtcNow.AddHours(8)
            });

            return Ok(new { 
                message = "Login berhasil!",
                user = new { id = user.Id, nama = user.Nama, role = user.Role } 
            });
        }
    }
}

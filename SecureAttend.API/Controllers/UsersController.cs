using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace SecureAttend.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Secara default harus login
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN,KEPALA_SEKOLAH")] // Hanya Admin & Kepsek
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Nama,
                    u.Role,
                    u.StatusAktif
                })
                .ToListAsync();

            return Ok(users);
        }

        // POST: api/users
        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN")] // Hanya Super Admin yang bisa buat user
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest req)
        {
            if (string.IsNullOrEmpty(req.Username) || string.IsNullOrEmpty(req.Password) || string.IsNullOrEmpty(req.Nama))
            {
                return BadRequest(new { message = "Semua kolom wajib diisi." });
            }

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Username sudah digunakan." });
            }

            var newUser = new User
            {
                Username = req.Username,
                Nama = req.Nama,
                Role = "GURU", // OWASP BAC: Prevent privilege escalation from client request
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                StatusAktif = true,
                IsDeletable = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pengguna berhasil ditambahkan.", user = new { newUser.Id, newUser.Username, newUser.Nama, newUser.Role } });
        }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}

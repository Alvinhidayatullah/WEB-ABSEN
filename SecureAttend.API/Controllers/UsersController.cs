using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System.Linq;
using System.Security.Claims;
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
                .OrderByDescending(u => u.Id)
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

            // Validasi Role Ketat
            var allowedRoles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH", "GURU" };
            var assignedRole = req.Role?.ToUpper();

            if (string.IsNullOrEmpty(assignedRole) || !allowedRoles.Contains(assignedRole))
            {
                return BadRequest(new { message = "400 Bad Request: Role tidak valid. Harus SUPER_ADMIN, KEPALA_SEKOLAH, atau GURU." });
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
                Role = assignedRole,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                StatusAktif = true,
                IsDeletable = true // Super admin bisa dihapus, kecuali vinz_admin (di-handle di Delete)
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pengguna berhasil ditambahkan.", user = new { newUser.Id, newUser.Username, newUser.Nama, newUser.Role } });
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var targetUser = await _context.Users.FindAsync(id);
            if (targetUser == null)
            {
                return NotFound(new { message = "Pengguna tidak ditemukan." });
            }

            // Proteksi Mutlak
            if (targetUser.Username == "vinz_admin" || !targetUser.IsDeletable)
            {
                return BadRequest(new { message = "Akses Ditolak: Akun utama sistem (vinz_admin) tidak boleh dihapus!" });
            }

            _context.Users.Remove(targetUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pengguna berhasil dihapus." });
        }

        // PUT: api/users/profile
        [HttpPut("profile")]
        // Bisa diakses GURU, KEPALA_SEKOLAH, SUPER_ADMIN
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
        {
            // Proteksi IDOR: Ambil ID dari JWT murni, bukan dari parameter request
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "Sesi tidak valid." });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Pengguna tidak ditemukan." });
            }

            // Jika update username/nama
            if (!string.IsNullOrEmpty(req.Username))
            {
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == req.Username && u.Id != userId);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "Username sudah digunakan oleh orang lain." });
                }
                user.Username = req.Username;
            }

            if (!string.IsNullOrEmpty(req.Nama))
            {
                user.Nama = req.Nama;
            }

            // Logika Update Password
            if (!string.IsNullOrEmpty(req.NewPassword))
            {
                if (string.IsNullOrEmpty(req.OldPassword))
                {
                    return BadRequest(new { message = "Password lama wajib diisi untuk mengubah password." });
                }

                bool isMatch = BCrypt.Net.BCrypt.Verify(req.OldPassword, user.PasswordHash);
                if (!isMatch)
                {
                    return BadRequest(new { message = "Password lama salah." });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil berhasil diperbarui.", user = new { user.Id, user.Username, user.Nama, user.Role } });
        }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string? Username { get; set; }
        public string? Nama { get; set; }
        public string? OldPassword { get; set; }
        public string? NewPassword { get; set; }
    }
}

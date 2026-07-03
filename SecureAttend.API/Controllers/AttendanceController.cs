using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SecureAttend.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/attendance/check-in
        [HttpPost("check-in")]
        [Authorize(Roles = "GURU")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest req)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "Sesi tidak valid." });
            }

            var today = DateTime.UtcNow.Date;
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Tanggal == today);

            if (existingAttendance != null)
            {
                return BadRequest(new { message = "Anda sudah melakukan absen hari ini." });
            }

            var attendance = new Attendance
            {
                UserId = userId,
                Tanggal = today,
                JamMasuk = DateTime.UtcNow.TimeOfDay,
                Status = "Hadir", // Bisa dilogika 'Terlambat' jika > jam tertentu
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                IsMockLocation = req.IsMockLocation,
                IP_Address = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Absen masuk berhasil dicatat.", time = attendance.JamMasuk });
        }

        // GET: api/attendance/me
        [HttpGet("me")]
        [Authorize(Roles = "GURU")]
        public async Task<IActionResult> GetMyAttendance()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var history = await _context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Tanggal)
                .Select(a => new { a.Tanggal, a.JamMasuk, a.Status, a.Latitude, a.Longitude, a.IsMockLocation })
                .Take(30)
                .ToListAsync();

            return Ok(history);
        }

        // GET: api/attendance/today
        [HttpGet("today")]
        [Authorize(Roles = "SUPER_ADMIN,KEPALA_SEKOLAH")]
        public async Task<IActionResult> GetTodayStats()
        {
            var today = DateTime.UtcNow.Date;
            var totalGuru = await _context.Users.CountAsync(u => u.Role == "GURU" && u.StatusAktif);
            var hadirHariIni = await _context.Attendances.CountAsync(a => a.Tanggal == today && a.Status == "Hadir");
            var izinSakit = await _context.Attendances.CountAsync(a => a.Tanggal == today && (a.Status == "Izin" || a.Status == "Sakit"));

            return Ok(new
            {
                totalGuru,
                hadirHariIni,
                izinSakit
            });
        }
    }

    public class CheckInRequest
    {
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsMockLocation { get; set; } = false;
    }
}

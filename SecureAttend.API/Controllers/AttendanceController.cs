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

        // Kordinat Mutlak SMK YASDA
        private const double SCHOOL_LAT = -7.014843;
        private const double SCHOOL_LNG = 106.545348;
        private const double MAX_RADIUS_METERS = 100.0;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Metode Haversine untuk menghitung jarak antara dua koordinat bumi
        private double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // Radius Bumi dalam meter
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            
            return R * c;
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

            // Validasi Geofence (Keamanan Berlapis di Backend)
            if (!req.Latitude.HasValue || !req.Longitude.HasValue)
            {
                return BadRequest(new { message = "Koordinat GPS tidak ditemukan. Pastikan akses lokasi diizinkan." });
            }

            double distance = CalculateDistanceMeters(req.Latitude.Value, req.Longitude.Value, SCHOOL_LAT, SCHOOL_LNG);
            
            if (distance > MAX_RADIUS_METERS)
            {
                return BadRequest(new { message = $"Akses Ditolak! Anda berada di luar radius sekolah. Jarak Anda saat ini: {Math.Round(distance)} meter." });
            }

            if (req.IsMockLocation)
            {
                return BadRequest(new { message = "Sistem mendeteksi penggunaan Lokasi Palsu (Fake GPS). Absensi ditolak." });
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

            return Ok(new { message = $"Absen sukses! Jarak tervalidasi: {Math.Round(distance)}m dari titik pusat.", time = attendance.JamMasuk });
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
        // POST: api/attendance/permit
        [HttpPost("permit")]
        [Authorize(Roles = "GURU,KEPALA_SEKOLAH")]
        public async Task<IActionResult> SubmitPermit([FromBody] PermitRequest req)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (req.Status != "Izin" && req.Status != "Sakit")
            {
                return BadRequest(new { message = "Status hanya boleh Izin atau Sakit." });
            }

            if (string.IsNullOrWhiteSpace(req.Keterangan))
            {
                return BadRequest(new { message = "Keterangan wajib diisi." });
            }

            var today = DateTime.UtcNow.Date;
            var existing = await _context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Tanggal == today);
            
            if (existing != null)
            {
                return BadRequest(new { message = "Anda sudah melakukan absen hari ini." });
            }

            var attendance = new Attendance
            {
                UserId = userId,
                Tanggal = today,
                JamMasuk = DateTime.UtcNow.TimeOfDay,
                Status = req.Status,
                Keterangan = req.Keterangan,
                IP_Address = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Berhasil mengajukan {req.Status}." });
        }

        // GET: api/attendance/all
        [HttpGet("all")]
        [Authorize(Roles = "SUPER_ADMIN,KEPALA_SEKOLAH")]
        public async Task<IActionResult> GetAllAttendances([FromQuery] int? month, [FromQuery] int? year)
        {
            var query = _context.Attendances.Include(a => a.User).AsQueryable();

            if (month.HasValue && year.HasValue)
            {
                query = query.Where(a => a.Tanggal.Month == month.Value && a.Tanggal.Year == year.Value);
            }

            var data = await query.OrderByDescending(a => a.Tanggal)
                .Select(a => new
                {
                    a.Id,
                    Username = a.User.Username,
                    Nama = a.User.Nama,
                    Role = a.User.Role,
                    a.Tanggal,
                    JamMasuk = a.JamMasuk.HasValue ? a.JamMasuk.Value.ToString(@"hh\:mm") : null,
                    a.Status,
                    a.Keterangan
                })
                .ToListAsync();

            return Ok(data);
        }

        // DELETE: api/attendance/month/{year}/{month}
        [HttpDelete("month/{year}/{month}")]
        [Authorize(Roles = "SUPER_ADMIN,KEPALA_SEKOLAH")]
        public async Task<IActionResult> DeleteMonthlyData(int year, int month)
        {
            var oldData = await _context.Attendances
                .Where(a => a.Tanggal.Year == year && a.Tanggal.Month == month)
                .ToListAsync();

            if (!oldData.Any())
            {
                return NotFound(new { message = "Tidak ada data pada bulan dan tahun tersebut." });
            }

            _context.Attendances.RemoveRange(oldData);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{oldData.Count} data absensi berhasil dihapus untuk menghemat storage." });
        }
    }

    public class CheckInRequest
    {
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsMockLocation { get; set; } = false;
    }

    public class PermitRequest
    {
        public string Status { get; set; } = string.Empty;
        public string Keterangan { get; set; } = string.Empty;
    }
}

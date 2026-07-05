using HotChocolate;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace SecureAttend.API.GraphQL
{
    public class Mutation
    {
        private const double SCHOOL_LAT = -7.014843;
        private const double SCHOOL_LNG = 106.545348;
        private const double MAX_RADIUS_METERS = 300.0;

        private double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        public async Task<AuthPayload> Login(
            string username, 
            string password, 
            [Service] ApplicationDbContext context, 
            [Service] IConfiguration configuration, 
            [Service] IHttpContextAccessor httpContextAccessor)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null || !user.StatusAktif)
            {
                throw new GraphQLException("ID atau Kata Sandi salah, atau akun dinonaktifkan.");
            }

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                throw new GraphQLException("ID atau Kata Sandi salah.");
            }

            var jwtSecret = configuration["Jwt:Secret"];
            if (string.IsNullOrEmpty(jwtSecret)) throw new Exception("JWT Secret missing");

            var key = Encoding.ASCII.GetBytes(jwtSecret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddDays(3),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            httpContextAccessor.HttpContext?.Response.Cookies.Append("RuangHadir_Session", tokenString, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(3)
            });

            return new AuthPayload { Message = "Login berhasil!", User = user };
        }

        public string Logout([Service] IHttpContextAccessor httpContextAccessor)
        {
            httpContextAccessor.HttpContext?.Response.Cookies.Delete("RuangHadir_Session", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
            return "Berhasil keluar.";
        }

        [Authorize(Roles = new[] { "GURU", "KEPALA_SEKOLAH" })]
        public async Task<MessagePayload> CheckIn(
            double? latitude,
            double? longitude,
            bool isMockLocation,
            double? accuracy,
            [Service] ApplicationDbContext context,
            [Service] IHttpContextAccessor httpContextAccessor,
            [Service] IConfiguration config)
        {
            var userIdStr = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) throw new GraphQLException("Sesi tidak valid.");

            // === LAYER 1: Cek data koordinat ada ===
            if (!latitude.HasValue || !longitude.HasValue)
                throw new GraphQLException("Koordinat GPS tidak ditemukan. Pastikan akses lokasi diizinkan.");

            // === LAYER 1.5: Anti-Tamper Security (HMAC) ===
            var tamperSecret = config["TamperSecret"];
            if (!string.IsNullOrEmpty(tamperSecret)) 
            {
                var signatureHeader = httpContextAccessor.HttpContext?.Request.Headers["X-Tamper-Signature"].FirstOrDefault();
                if (string.IsNullOrEmpty(signatureHeader)) {
                    throw new GraphQLException("Akses Ditolak! Keamanan Anti-Tamper: Signature hilang.");
                }

                var payloadStr = $"{latitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)},{longitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
                using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(tamperSecret))) {
                    var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadStr));
                    var expectedSignature = Convert.ToBase64String(hashBytes);
                    if (signatureHeader != expectedSignature) {
                        throw new GraphQLException("Akses Ditolak! Manipulasi Request (Tampering) Terdeteksi.");
                    }
                }
            }

            // === LAYER 2: Anti Fake GPS — flag dari browser ===
            if (isMockLocation)
                throw new GraphQLException("Sistem mendeteksi penggunaan GPS Palsu (Mock Location). Absensi ditolak.");

            var lat = latitude.Value;
            var lng = longitude.Value;

            // === LAYER 2.5: Server-Side Movement Anomaly Detection ===
            var lastLoc = await context.UserLocations
                .Where(ul => ul.UserId == userId)
                .OrderByDescending(ul => ul.UpdatedAt)
                .FirstOrDefaultAsync();

            if (lastLoc != null)
            {
                double distKm = CalculateDistanceMeters(lastLoc.Latitude, lastLoc.Longitude, lat, lng) / 1000.0;
                double hoursPassed = (DateTime.UtcNow - lastLoc.UpdatedAt).TotalHours;
                
                // Hanya cek anomali jika jarak waktu kurang dari 1 jam
                if (hoursPassed > 0 && hoursPassed < 1.0) 
                {
                    double speedKmh = distKm / hoursPassed;
                    if (speedKmh > 60.0) // Batas kecepatan 60 km/jam (1 km / menit)
                    {
                        throw new GraphQLException($"Akses Ditolak! Pergerakan tidak wajar terdeteksi (Kecepatan ~{Math.Round(speedKmh)} km/jam). Harap matikan aplikasi lokasi palsu atau tunggu beberapa saat.");
                    }
                }
            }

            // Simpan lokasi terbaru ke riwayat
            if (lastLoc != null)
            {
                lastLoc.Latitude = lat;
                lastLoc.Longitude = lng;
                lastLoc.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                context.UserLocations.Add(new UserLocation { UserId = userId, Latitude = lat, Longitude = lng, UpdatedAt = DateTime.UtcNow });
            }

            // === LAYER 3: Validasi batas wilayah Indonesia ===
            // Wilayah Indonesia: Lat -11 s/d 6, Lng 95 s/d 141
            if (lat < -11.0 || lat > 6.0 || lng < 95.0 || lng > 141.0)
                throw new GraphQLException("Koordinat GPS tidak valid atau di luar wilayah Indonesia. Kemungkinan terjadi manipulasi data.");

            // === LAYER 4: Validasi akurasi GPS (maksimal 50 meter) ===
            if (accuracy.HasValue && accuracy.Value > 50.0)
                throw new GraphQLException($"Sinyal GPS terlalu lemah (akurasi: {Math.Round(accuracy.Value)}m). Pindah ke tempat lebih terbuka dan coba lagi.");

            // === LAYER 5: Validasi Geofence (Haversine radius) ===
            double distance = CalculateDistanceMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
            if (distance > MAX_RADIUS_METERS)
                throw new GraphQLException($"Akses Ditolak! Anda berada di luar radius sekolah. Jarak Anda: {Math.Round(distance)} meter dari pusat sekolah.");

            // === LAYER 6: Cegah duplikasi absen hari ini ===
            var wibTime = DateTime.UtcNow.AddHours(7);
            var today = wibTime.Date;
            var existingAttendance = await context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Tanggal == today);
            if (existingAttendance != null) throw new GraphQLException("Anda sudah melakukan absen hari ini.");

            var attendance = new Attendance
            {
                UserId = userId,
                Tanggal = today,
                JamMasuk = new TimeSpan(wibTime.Hour, wibTime.Minute, wibTime.Second),
                Status = "Hadir",
                Latitude = lat,
                Longitude = lng,
                IsMockLocation = isMockLocation,
                Accuracy = accuracy,
                IP_Address = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            };

            context.Attendances.Add(attendance);
            await context.SaveChangesAsync();

            return new MessagePayload { Message = $"Absen sukses! Tervalidasi dalam radius {Math.Round(distance)}m dari SMK YASDA.", Success = true };
        }

        [Authorize(Roles = new[] { "GURU", "KEPALA_SEKOLAH" })]
        public async Task<bool> TrackLocation(
            double latitude,
            double longitude,
            [Service] ApplicationDbContext context,
            [Service] IHttpContextAccessor httpContextAccessor)
        {
            var userIdStr = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return false;

            var lastLoc = await context.UserLocations.FirstOrDefaultAsync(ul => ul.UserId == userId);
            if (lastLoc != null)
            {
                lastLoc.Latitude = latitude;
                lastLoc.Longitude = longitude;
                lastLoc.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                context.UserLocations.Add(new UserLocation { UserId = userId, Latitude = latitude, Longitude = longitude, UpdatedAt = DateTime.UtcNow });
            }
            
            await context.SaveChangesAsync();
            return true;
        }

        [Authorize(Roles = new[] { "GURU", "KEPALA_SEKOLAH" })]
        public async Task<MessagePayload> SubmitPermit(
            string status, 
            string keterangan,
            [Service] ApplicationDbContext context,
            [Service] IHttpContextAccessor httpContextAccessor)
        {
            var userIdStr = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) throw new GraphQLException("Sesi tidak valid.");

            if (status != "Izin" && status != "Sakit") throw new GraphQLException("Status hanya boleh Izin atau Sakit.");
            if (string.IsNullOrWhiteSpace(keterangan)) throw new GraphQLException("Keterangan wajib diisi.");

            var wibTime = DateTime.UtcNow.AddHours(7);
            var today = wibTime.Date;
            
            var existing = await context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Tanggal == today);
            if (existing != null) throw new GraphQLException("Anda sudah melakukan absen hari ini.");

            var attendance = new Attendance
            {
                UserId = userId,
                Tanggal = today,
                JamMasuk = new TimeSpan(wibTime.Hour, wibTime.Minute, wibTime.Second),
                Status = status,
                Keterangan = keterangan,
                IP_Address = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            };

            context.Attendances.Add(attendance);
            await context.SaveChangesAsync();

            return new MessagePayload { Message = $"Berhasil mengajukan {status}.", Success = true };
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH" })]
        public async Task<MessagePayload> DeleteMonthlyData(int year, int month, [Service] ApplicationDbContext context)
        {
            var oldData = await context.Attendances.Where(a => a.Tanggal.Year == year && a.Tanggal.Month == month).ToListAsync();
            if (!oldData.Any()) throw new GraphQLException("Tidak ada data pada bulan dan tahun tersebut.");

            context.Attendances.RemoveRange(oldData);
            await context.SaveChangesAsync();
            return new MessagePayload { Message = $"{oldData.Count} data absensi berhasil dihapus.", Success = true };
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH" })]
        public async Task<MessagePayload> DeleteBulkData(List<int> ids, [Service] ApplicationDbContext context)
        {
            if (ids == null || !ids.Any()) throw new GraphQLException("Tidak ada data yang dipilih.");

            var targetData = await context.Attendances.Where(a => ids.Contains(a.Id)).ToListAsync();
            if (!targetData.Any()) throw new GraphQLException("Data tidak ditemukan.");

            context.Attendances.RemoveRange(targetData);
            await context.SaveChangesAsync();
            return new MessagePayload { Message = $"{targetData.Count} data berhasil dihapus terpilih.", Success = true };
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN" })]
        public async Task<MessagePayload> CreateUser(
            string username, string nama, string password, string role,
            [Service] ApplicationDbContext context)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(nama))
                throw new GraphQLException("Semua kolom wajib diisi.");

            var allowedRoles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH", "GURU" };
            var assignedRole = role?.ToUpper();
            if (string.IsNullOrEmpty(assignedRole) || !allowedRoles.Contains(assignedRole))
                throw new GraphQLException("Role tidak valid.");

            if (await context.Users.AnyAsync(u => u.Username == username))
                throw new GraphQLException("Username sudah digunakan.");

            var newUser = new User
            {
                Username = username,
                Nama = nama,
                Role = assignedRole,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                StatusAktif = true,
                IsDeletable = true
            };

            context.Users.Add(newUser);
            await context.SaveChangesAsync();
            return new MessagePayload { Message = "Pengguna berhasil ditambahkan.", Success = true };
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN" })]
        public async Task<MessagePayload> DeleteUser(int id, [Service] ApplicationDbContext context)
        {
            var targetUser = await context.Users.FindAsync(id);
            if (targetUser == null) throw new GraphQLException("Pengguna tidak ditemukan.");
            if (targetUser.Username == "vinz_admin" || !targetUser.IsDeletable)
                throw new GraphQLException("Akses Ditolak: Akun utama sistem tidak boleh dihapus!");

            context.Users.Remove(targetUser);
            await context.SaveChangesAsync();
            return new MessagePayload { Message = "Pengguna berhasil dihapus.", Success = true };
        }

        [Authorize]
        public async Task<MessagePayload> UpdateProfile(
            string? nama,
            string? currentPassword,
            string? newPassword,
            [Service] ApplicationDbContext context,
            [Service] IHttpContextAccessor httpContextAccessor)
        {
            var userStr = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userStr, out int userId)) throw new GraphQLException("Sesi tidak valid.");

            var user = await context.Users.FindAsync(userId);
            if (user == null) throw new GraphQLException("Pengguna tidak ditemukan.");

            if (!string.IsNullOrWhiteSpace(nama))
            {
                user.Nama = nama.Trim();
            }

            if (!string.IsNullOrWhiteSpace(newPassword))
            {
                if (string.IsNullOrWhiteSpace(currentPassword))
                {
                    throw new GraphQLException("Anda harus memasukkan Password Saat Ini untuk mengubah password.");
                }

                if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                {
                    throw new GraphQLException("Gagal Verifikasi Keamanan OWASP: Password Saat Ini salah.");
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            }

            await context.SaveChangesAsync();
            return new MessagePayload { Message = "Profil berhasil diperbarui.", Success = true };
        }
    }

    public class AuthPayload
    {
        public string Message { get; set; } = string.Empty;
        public User? User { get; set; }
    }

    public class MessagePayload
    {
        public string Message { get; set; } = string.Empty;
        public bool Success { get; set; }
    }
}

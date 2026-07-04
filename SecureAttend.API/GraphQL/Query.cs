using HotChocolate;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;
using SecureAttend.API.Data;
using SecureAttend.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SecureAttend.API.GraphQL
{
    public class Query
    {
        [Authorize(Roles = new[] { "GURU", "KEPALA_SEKOLAH" })]
        public async Task<List<Attendance>> GetMe(
            [Service] ApplicationDbContext context,
            [Service] IHttpContextAccessor httpContextAccessor)
        {
            var userStr = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userStr, out int userId))
            {
                throw new GraphQLException("Sesi tidak valid.");
            }

            return await context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Tanggal)
                .Take(30)
                .ToListAsync();
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH" })]
        public async Task<List<User>> GetUsers([Service] ApplicationDbContext context)
        {
            return await context.Users
                .OrderByDescending(u => u.Id)
                .ToListAsync();
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH" })]
        public async Task<List<Attendance>> GetAllAttendances(
            int? month, 
            int? year, 
            [Service] ApplicationDbContext context)
        {
            var query = context.Attendances.Include(a => a.User).AsQueryable();

            if (month.HasValue && year.HasValue)
            {
                query = query.Where(a => a.Tanggal.Month == month.Value && a.Tanggal.Year == year.Value);
            }

            return await query.OrderByDescending(a => a.Tanggal).ToListAsync();
        }

        [Authorize(Roles = new[] { "SUPER_ADMIN", "KEPALA_SEKOLAH" })]
        public async Task<TodayStatsPayload> GetTodayStats([Service] ApplicationDbContext context)
        {
            var wibTime = DateTime.UtcNow.AddHours(7);
            var today = wibTime.Date;
            
            var totalGuru = await context.Users.CountAsync(u => u.Role == "GURU" && u.StatusAktif);
            var hadirHariIni = await context.Attendances.CountAsync(a => a.Tanggal == today && a.Status == "Hadir");
            var izinSakit = await context.Attendances.CountAsync(a => a.Tanggal == today && (a.Status == "Izin" || a.Status == "Sakit"));

            return new TodayStatsPayload
            {
                TotalGuru = totalGuru,
                HadirHariIni = hadirHariIni,
                IzinSakit = izinSakit
            };
        }
    }

    public class TodayStatsPayload
    {
        public int TotalGuru { get; set; }
        public int HadirHariIni { get; set; }
        public int IzinSakit { get; set; }
    }
}

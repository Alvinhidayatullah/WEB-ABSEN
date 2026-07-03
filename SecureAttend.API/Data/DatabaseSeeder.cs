using System;
using System.Linq;
using SecureAttend.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace SecureAttend.API.Data
{
    public static class DatabaseSeeder
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new ApplicationDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>()))
            {
                // Cek jika user sudah ada
                if (context.Set<User>().Any())
                {
                    return;   // DB has been seeded
                }

                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                var username = configuration["SuperAdmin:Username"] ?? "vinz_admin";
                var password = configuration["SuperAdmin:Password"];

                if (string.IsNullOrEmpty(password))
                {
                    throw new Exception("SuperAdmin password not found in configuration!");
                }

                // Data Super Admin Default (Username & Password dari Config)
                var superAdmin = new User
                {
                    Username = username,
                    Nama = "Super Admin",
                    Role = "SUPER_ADMIN", // Akses tertinggi
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    StatusAktif = true,
                    IsDeletable = false // Sesuai permintaan, akun ini tidak bisa dihapus
                };

                context.Set<User>().Add(superAdmin);
                context.SaveChanges();
            }
        }
    }
}

using System;

namespace SecureAttend.API.Models
{
    public class Attendance
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime Tanggal { get; set; }
        public TimeSpan? JamMasuk { get; set; }
        public TimeSpan? JamPulang { get; set; }
        public string Status { get; set; } = string.Empty; // Hadir, Terlambat, Alpha
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Accuracy { get; set; } // Akurasi GPS dalam meter (untuk audit anti-cheat)
        public bool IsMockLocation { get; set; } = false; // Mock GPS / Fake Location Detection
        public string? IP_Address { get; set; }
        public string? Keterangan { get; set; } // Untuk Izin / Sakit
    }
}

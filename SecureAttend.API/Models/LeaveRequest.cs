using System;

namespace SecureAttend.API.Models
{
    public class LeaveRequest
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime TanggalMulai { get; set; }
        public DateTime TanggalSelesai { get; set; }
        public string Jenis { get; set; } = string.Empty; // Sakit, Izin, Cuti
        public string Alasan { get; set; } = string.Empty;
        public string? BuktiFileUrl { get; set; }
        public string StatusPersetujuan { get; set; } = "Menunggu"; // Menunggu, Disetujui, Ditolak
    }
}

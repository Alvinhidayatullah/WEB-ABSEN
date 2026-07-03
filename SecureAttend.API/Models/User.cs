using System;

namespace SecureAttend.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty; // NIP atau ID Custom
        public string Nama { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // SUPER_ADMIN, KEPALA_SEKOLAH, GURU
        public string? DeviceID { get; set; } // Hardware Binding (Device Fingerprinting)
        public bool StatusAktif { get; set; } = true;
        public bool IsDeletable { get; set; } = true; // Proteksi agar Super Admin utama tidak bisa dihapus
    }
}

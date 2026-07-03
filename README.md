# SecureAttend (Sistem Absensi Guru Terpadu)

**Version:** 2.0.0 (Eco-Cyber Security & Active Defense Edition)
**Vendor/Architecture Standard:** Elite Sentinel Cybercorp

## 1. Ringkasan Eksekutif (Executive Summary)
SecureAttend adalah aplikasi Absensi Guru berbasis web modern yang dibangun dengan arsitektur "Zero-Trust" dan kepatuhan penuh terhadap standar keamanan OWASP Top-10. Dirancang pertama kali untuk SMK Pertanian (namun sangat skalabel untuk diadopsi oleh sekolah lain), sistem ini menggabungkan tema visual yang santai dan natural dengan mesin keamanan kelas militer. Sistem menjamin keakuratan data presensi melalui validasi lokasi absolut, dilengkapi mekanisme *Active Defense* untuk memblokir intrusi peretasan otomatis, sambil tetap memberikan pengalaman antarmuka yang sangat responsif, elegan, dan ringan di berbagai perangkat.

## 2. Arsitektur & Teknologi (Tech Stack)
Aplikasi menggunakan arsitektur *Separated Fullstack* (*Decoupled*) untuk isolasi jaringan maksimum dan performa tinggi:
* **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4.
* **Backend:** .NET 9 Web API (C#).
* **Database & ORM:** PostgreSQL dengan Entity Framework Core (EF Core) v9.
* **Keamanan Akses & Identitas:** JWT tersimpan di *Secure HttpOnly Cookies*, rotasi *Refresh Token*, dan ASP.NET Core Identity.

## 3. Fitur Utama
* **Standar Keamanan OWASP Top-10 & Active Defense**: Kebal terhadap BAC, SQLi, XSS, XXE, dll.
* **Anti-Scanner Drop Mechanism**: Memutus koneksi otomatis (HTTP 444) jika mendeteksi scanner (Burp, ZAP, SQLMap).
* **Anti-DDoS & Rate Limiting**: Algoritma Token Bucket (10 request/detik).
* **Geofencing & Anti-Fraud**: Strict radius check menggunakan formula Haversine. Mock GPS & Fake Location Detection.
* **Role-Based Access Control (RBAC)**: Pemisahan hak SUPER_ADMIN, KEPALA_SEKOLAH, dan GURU.
* **UI/UX Elegan**: Mengusung desain *Eco-Tech Theme* dengan rasio mobile-first (720x1560) yang responsif dan sangat cepat.

## 4. Cara Menjalankan (How to Run)

### Backend (.NET API)
1. Buka terminal dan arahkan ke direktori `SecureAttend.API`.
2. Pastikan database PostgreSQL sudah disetup (koneksi di `appsettings.json`).
3. Jalankan perintah:
   ```bash
   dotnet run
   ```

### Frontend (Next.js)
1. Buka terminal lain dan arahkan ke direktori `secure-attend-client`.
2. Install dependensi (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

## 5. Struktur Direktori Utama
* `secure-attend-client/` - Frontend Next.js (App Router, Tailwind CSS)
* `SecureAttend.API/` - Backend .NET 9 Web API (Entity Framework Core, PostgreSQL)

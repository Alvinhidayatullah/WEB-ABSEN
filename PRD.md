# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Name:** RuangHadir (Sistem Absensi Guru Terpadu)
**Version:** 2.1.0 (Eco-Cyber Security & Active Defense Edition)
**Vendor/Architecture Standard:** Elite Sentinel Cybercorp

## 1. Ringkasan Eksekutif (Executive Summary)
RuangHadir (sebelumnya bernama SecureAttend) adalah aplikasi Absensi Guru berbasis web modern yang dibangun dengan arsitektur "Zero-Trust" dan kepatuhan penuh terhadap standar keamanan OWASP Top-10. Dirancang pertama kali untuk SMK Pertanian (namun sangat skalabel untuk diadopsi oleh sekolah lain), sistem ini menggabungkan tema visual yang santai dan natural dengan mesin keamanan kelas militer. Sistem menjamin keakuratan data presensi melalui validasi lokasi absolut, dilengkapi mekanisme *Active Defense* untuk memblokir intrusi peretasan otomatis, sambil tetap memberikan pengalaman antarmuka yang sangat responsif, elegan, dan ringan di berbagai perangkat.

## 2. Arsitektur & Teknologi (Tech Stack)
Aplikasi menggunakan arsitektur *Separated Fullstack* (*Decoupled*) untuk isolasi jaringan maksimum dan performa tinggi:
* **Frontend:** Next.js 15.3 (App Router), React 19, Tailwind CSS v4. Di-*hosting* di Vercel Edge Network dengan proteksi Anti-DDoS lapis pertama.
* **Backend:** .NET 9 Web API (C#) dengan namespace inti `SecureAttend.API`. Di-*hosting* di *cloud* tertutup yang hanya menerima lalu lintas dari *frontend*. Sistem tipe statisnya imun terhadap banyak celah keamanan memori.
* **Database & ORM:** PostgreSQL dengan Entity Framework Core (EF Core) v9.
* **Keamanan Akses & Identitas:** JWT tersimpan di *Secure HttpOnly Cookies* (`RuangHadir_Session`), rotasi *Refresh Token*, dan ASP.NET Core Identity.
* **Utilitas:** SheetJS / XLSX untuk ekspor laporan absensi (Evaluasi) ke Excel langsung dari sisi klien (Browser).

## 3. Spesifikasi UI/UX & Desain Estetika (Eco-Tech Theme)
Antarmuka dirancang fungsional, estetik, dan nyaman di mata untuk penggunaan harian:
* **Mobile-First Responsive (No Letterboxing):** Tata letak dibangun presisi pada rasio 720x1560 piksel dengan konfigurasi skala *viewport* absolut. Sidebar *desktop* otomatis bertransisi menjadi navigasi bar *scrollable* horizontal di bagian bawah/atas pada tampilan *mobile* demi kenyamanan pengguna gawai.
* **Elemen Visual Santai & Keren:** Mengusung palet warna hijau yang santai (*sage green* atau *emerald* redup) yang dipadukan dengan *Glassmorphism*. Identitas merek telah sepenuhnya bertransisi menjadi **RuangHadir** dengan ikonografi khas.
* **Halaman 403 Forbidden yang Elegan:** Menolak akses ilegal dengan antarmuka estetik namun intimidatif bergaya *glitch* digital.
* **Dashboard Role-Based:** Pengalaman antarmuka disesuaikan secara dinamis untuk masing-masing tipe akun (Guru, Kepala Sekolah, Admin) tanpa memuat elemen yang tidak perlu.

## 4. Standar Keamanan OWASP Top-10 & Active Defense
* **Sesi JWT & Anti-Cookie Injection (3 Hari):** Menggunakan *Secure HttpOnly Cookies* (`RuangHadir_Session`) yang kebal terhadap manipulasi sisi klien (XSS).
* **Broken Access Control (BAC) Strict Enforcement:** Validasi ganda mutlak (Frontend & Backend). Aksi krusial (seperti membuat pengguna) dibatasi ketat untuk `SUPER_ADMIN`.
* **Injection (SQLi & Command Injection):** Murni mengandalkan *Parameterized Queries* dari EF Core yang menetralisir semua percobaan SQL Injection.
* **Cross-Site Scripting (XSS):** React 19 secara otomatis melakukan *escape* pada semua *output*.
* **Anti-Scanner Drop Mechanism:** Middleware .NET memutus koneksi (HTTP 444 *No Response*) secara instan jika mendeteksi *User-Agent* dari perangkat *scanner* peretas otomatis (Burp, ZAP, SQLMap).
* **Anti-DDoS & Rate Limiting:** Mengimplementasikan algoritma *Token Bucket* (maksimal 10 *request*/detik per IP) untuk membendung lonjakan trafik anomali.

## 5. Fitur Fungsional Inti & Anti-Kecurangan
* **Role-Based Access Control (RBAC):** Pemisahan hak akses antara SUPER_ADMIN, KEPALA_SEKOLAH, dan GURU. Kepala Sekolah memiliki wewenang untuk mengevaluasi data bulanan seluruh staf sekaligus memiliki akses untuk melakukan check-in mandiri.
* **Waktu Mutlak Global Server (UTC+7 WIB):** Pencatatan Jam Masuk dilakukan 100% menggunakan kapabilitas *TimeOfDay* milik *server backend* hingga tingkat detik (hh:mm:ss). Ini mencegah modifikasi waktu lokal pada gawai pengguna.
* **Strict Geofencing Radius Check:** Kalkulasi jarak menggunakan rumus *Haversine* secara *server-side*.
* **Mock GPS / Fake Location Detection:** Validasi atribut *payload* GPS untuk memblokir indikasi Lokasi Palsu secara langsung.
* **Manajemen Izin & Sakit Tervalidasi:** Wajib menyertakan keterangan otentik yang akan tersimpan bersamaan dengan waktu (Jam) diajukannya izin tersebut.
* **Evaluasi & Optimisasi Data (Fitur Kepala Sekolah):**
  - **Ekspor Excel Pintar:** Mampu menghasilkan laporan absensi berbentuk `.xlsx` yang terstruktur rapi (kolom Jam Masuk dan Keterangan terpisah secara sistematis).
  - **Bulk Delete Selektif & Masif:** Kepala Sekolah memiliki modul khusus (Storage Optimization) untuk menghapus riwayat kehadiran tertentu secara spesifik melalui *checkbox*, atau membersihkan data keseluruhan dalam rentang satu bulan demi menghemat kapasitas pangkalan data.

## 6. Struktur Direktori Utama (Monorepo)
**a. Client-Side (Next.js Frontend)**
secure-attend-client/
├── src/
│   ├── app/                    # Routing Portal Absensi (Next.js App Router)
│   │   ├── admin/              # Panel Manajemen Terpusat (SUPER_ADMIN)
│   │   ├── kepsek/             # Portal KEPALA_SEKOLAH (Evaluasi Bulanan & Panel Absensi)
│   │   ├── teacher/            # Portal Khusus GURU
│   │   └── 403/                # Halaman Access Denied
│   ├── components/             # Komponen UI (Tailwind V4, Lucide)
│   └── middleware.ts           # Route Guarding & Auth Checks

**b. Server-Side (.NET 9 Web API Backend)**
SecureAttend.API/
├── Controllers/                # Endpoint REST API Terpusat
│   ├── AuthController.cs       
│   ├── AttendanceController.cs # Mengelola Check-In, Geolocation, Bulk Delete
│   └── UsersController.cs      # Manajemen Master Data Staf
├── Data/                       
│   └── ApplicationDbContext.cs # EF Core & PostgreSQL Integrator
├── Models/                     # Schema Data Internal
├── Program.cs                  # Injeksi WAF, CORS, Rate Limiting

## 7. Model Data (Struktur Database PostgreSQL)
* **Users:** `Id`, `Username`, `Nama`, `PasswordHash`, `Role`, `DeviceID`, `StatusAktif`, `IsDeletable`.
* **Attendances:** `Id`, `UserId`, `Tanggal`, `JamMasuk`, `JamPulang`, `Status`, `Latitude`, `Longitude`, `IsMockLocation`, `IP_Address`, `Keterangan`.
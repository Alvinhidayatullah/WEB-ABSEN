# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Name:** SecureAttend (Sistem Absensi Guru Terpadu)
**Version:** 2.0.0 (Eco-Cyber Security & Active Defense Edition)
**Vendor/Architecture Standard:** Elite Sentinel Cybercorp

## 1. Ringkasan Eksekutif (Executive Summary)
SecureAttend adalah aplikasi Absensi Guru berbasis web modern yang dibangun dengan arsitektur "Zero-Trust" dan kepatuhan penuh terhadap standar keamanan OWASP Top-10. Dirancang pertama kali untuk SMK Pertanian (namun sangat skalabel untuk diadopsi oleh sekolah lain), sistem ini menggabungkan tema visual yang santai dan natural dengan mesin keamanan kelas militer. Sistem menjamin keakuratan data presensi melalui validasi lokasi absolut, dilengkapi mekanisme *Active Defense* untuk memblokir intrusi peretasan otomatis, sambil tetap memberikan pengalaman antarmuka yang sangat responsif, elegan, dan ringan di berbagai perangkat.

## 2. Arsitektur & Teknologi (Tech Stack)
Aplikasi menggunakan arsitektur *Separated Fullstack* (*Decoupled*) untuk isolasi jaringan maksimum dan performa tinggi:
* **Frontend:** Next.js 15.3 (App Router), React 19, Tailwind CSS v4. Di-*hosting* di Vercel Edge Network dengan proteksi Anti-DDoS lapis pertama.
* **Backend:** .NET 9 Web API (C#). Di-*hosting* di *cloud* tertutup yang hanya menerima lalu lintas dari *frontend*. Sistem tipe statisnya imun terhadap banyak celah keamanan memori.
* **Database & ORM:** PostgreSQL dengan Entity Framework Core (EF Core) v9.
* **Keamanan Akses & Identitas:** JWT tersimpan di *Secure HttpOnly Cookies*, rotasi *Refresh Token*, dan ASP.NET Core Identity.
* **Utilitas:** ClosedXML / EPPlus (.NET) untuk kalkulasi dan ekspor laporan absensi ke Excel.

## 3. Spesifikasi UI/UX & Desain Estetika (Eco-Tech Theme)
Antarmuka dirancang fungsional, estetik, dan nyaman di mata untuk penggunaan harian:
* **Mobile-First 720x1560 Optimization:** Tata letak dibangun presisi pada rasio 720x1560 piksel, memastikan performa *rendering* instan tanpa *lag* di HP Android tipe apa pun.
* **Elemen Visual Santai & Keren:** Mengusung palet warna hijau yang santai (*sage green* atau *emerald* redup) yang tidak memaksa mata, cocok dengan identitas SMK Pertanian namun tetap elegan untuk instansi lain. Dipadukan dengan mode gelap (*clean dark mode*) atau mode terang yang lembut. Tombol navigasi dibuat lugas dan besar (misal: "KEMBALI", "ABSEN MASUK").
* **Halaman 403 Forbidden yang Elegan:** Jika pengguna mencoba meraba URL terlarang (`/admin`, `/config`), sistem menampilkan halaman 403 yang estetik namun intimidatif. Latar belakang hijau gelap berpadu hitam, tipografi bersih bertuliskan "ACCESS DENIED - ANOMALY DETECTED", disertai efek *glitch* digital halus dan hitung mundur otomatis sebelum dikembalikan ke halaman *login*.

## 4. Standar Keamanan OWASP Top-10 & Active Defense
Aplikasi ini kebal terhadap kerentanan aplikasi web paling kritis, dipadukan dengan pertahanan aktif:
* **Broken Access Control (BAC):** Validasi ganda (Frontend & Backend). Setiap *request* API diperiksa *Role Claim*-nya. Modifikasi ID pada *request* (IDOR) langsung memicu pemutusan sesi permanen.
* **Injection (SQLi & Command Injection):** Entity Framework Core menggunakan *Parameterized Queries* murni. *Payload* injeksi kutip tunggal (`' OR 1=1--`) otomatis dinetralisir menjadi teks biasa.
* **Cross-Site Scripting (XSS):** React 19 melakukan *escape* pada semua *output*. *Backend* menerapkan *Content-Security-Policy (CSP)* ketat untuk menolak eksekusi skrip eksternal.
* **XML External Entities (XXE):** *Backend* .NET hanya menerima *payload* JSON, memblokir penguraian (*parsing*) XML secara total.
* **Anti-Scanner Drop Mechanism:** Middleware .NET menganalisis *Header* HTTP. Jika terdeteksi *User-Agent* dari Burp Suite, ZAP, atau SQLMap, server tidak membalas dengan pesan *error*, melainkan langsung memutus koneksi (HTTP 444 *No Response*), membuat *scanner* menjadi *timeout*.
* **Anti-DDoS & Rate Limiting:** Vercel Edge Cache menyerap lonjakan trafik awal. *Backend* menggunakan algoritma *Token Bucket* (maksimal 10 *request*/detik per IP), memicu blokir IP sementara jika dilanggar.
* **Payload Anomaly Detection:** Menolak *request* dengan *body* terlalu besar atau berisi karakter eksotis (*fuzzing*).

## 5. Fitur Anti-Kecurangan Absensi (Anti-Fraud) & RBAC
* **SUPER_ADMIN, KEPALA_SEKOLAH, GURU:** Pemisahan hak akses ketat sesuai tupoksi masing-masing.
* **Strict Geofencing Radius Check:** Kalkulasi jarak kordinat dilakukan murni di *server-side* (.NET) menggunakan rumus *Haversine*.
* **Mock GPS / Fake Location Detection:** Validasi anomali *payload* Geolocation API untuk memblokir aplikasi pemalsu lokasi.
* **Hardware Binding (Device Fingerprinting):** Mengunci kombinasi akun guru dengan `DeviceID` fisik saat login pertama. Mencegah praktik titip absen dari HP lain.

## 6. Struktur Direktori Utama (Monorepo / Dual-Repository)
**a. Client-Side (Next.js Frontend)**
secure-attend-client/
├── src/
│   ├── app/                    # Routing Portal Absensi (Next.js App Router)
│   │   ├── admin/              # Panel SUPER_ADMIN
│   │   ├── kepsek/             # Panel KEPALA_SEKOLAH 
│   │   ├── teacher/            # Portal khusus GURU
│   │   └── 403/                # Halaman Access Denied Estetik
│   ├── components/             # Komponen UI (Tailwind V4, Lucide)
│   ├── services/               # API Fetcher (Axios/Fetch + Interceptor)
│   └── middleware.ts           # Route Guarding

**b. Server-Side (.NET 9 Web API Backend)**
SecureAttend.API/
├── Controllers/                # REST API (HTTPS Only)
│   ├── AuthController.cs       
│   ├── AttendanceController.cs 
│   └── ReportController.cs     
├── Data/                       
│   └── ApplicationDbContext.cs # EF Core & PostgreSQL
├── Models/                     # Entity Data Model
├── Services/                   
│   ├── GeoValidationService.cs # Kalkulasi Geofencing & Mock GPS
│   └── TokenService.cs         # Generasi JWT
├── Program.cs                  # WAF, CORS, Rate Limiting
└── appsettings.json            # Vault Rahasia

## 7. Model Data (Struktur Database PostgreSQL)
Berfungsi sebagai *Immutable Ledger* (Buku Besar Permanen):
* **Users:** `ID`, `NIP`, `Nama`, `PasswordHash`, `Role`, `DeviceID`, `StatusAktif`.
* **Attendances:** `ID`, `UserId`, `Tanggal`, `JamMasuk`, `JamPulang`, `Status`, `Latitude`, `Longitude`, `IsMockLocation`, `IP_Address`.
* **LeaveRequests:** `ID`, `UserId`, `TanggalMulai`, `TanggalSelesai`, `Jenis`, `Alasan`, `BuktiFileUrl`, `StatusPersetujuan`.
* **SchoolConfig:** `ID`, `SchoolLatitude`, `SchoolLongitude`, `RadiusToleransiMetre`, `JamMasukMulai`, `JamMasukBatas`.
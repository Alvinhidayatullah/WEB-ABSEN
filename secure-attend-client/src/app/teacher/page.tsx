"use client";
import { useEffect, useState } from "react";

export default function TeacherDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:5150/api/attendance/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleCheckIn = () => {
    setMessage({ type: "", text: "" });
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Browser Anda tidak mendukung Geolocation." });
      return;
    }

    setIsCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch("http://localhost:5150/api/attendance/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              latitude,
              longitude,
              isMockLocation: false // Sederhana: di mobile sesungguhnya perlu native API untuk cek mock
            })
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ type: "success", text: "Absensi berhasil dicatat!" });
            fetchHistory(); // Refresh riwayat
          } else {
            setMessage({ type: "error", text: data.message || "Gagal absen." });
          }
        } catch (err) {
          setMessage({ type: "error", text: "Terjadi kesalahan server." });
        } finally {
          setIsCheckingIn(false);
        }
      },
      (error) => {
        setIsCheckingIn(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMessage({ type: "error", text: "Anda harus mengizinkan akses lokasi untuk bisa absen." });
        } else {
          setMessage({ type: "error", text: "Gagal mendapatkan lokasi Anda." });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Mengecek apakah hari ini sudah absen
  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = history.some(h => h.tanggal.startsWith(todayStr));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Absensi Geofence</h1>
        <p className="text-foreground/60">Catat kehadiran Anda secara real-time dan aman.</p>
      </header>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {message.text}
        </div>
      )}

      {/* Area Absen (Scanner/Button) */}
      <div className="bg-card p-8 md:p-12 rounded-3xl shadow-sm border border-primary/10 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-6 mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 group-hover:border-primary/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Validasi Lokasi Aktif</h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">Sistem akan meminta izin GPS Anda untuk memvalidasi radius zona absensi sekolah.</p>

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || hasCheckedInToday}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2 mx-auto shadow-lg shadow-primary/20 ${
              hasCheckedInToday 
                ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed shadow-none border border-foreground/10'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 border border-primary'
            }`}
          >
            {isCheckingIn ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                MENDETEKSI LOKASI...
              </>
            ) : hasCheckedInToday ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                SUDAH ABSEN HARI INI
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                ABSEN SEKARANG
              </>
            )}
          </button>
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div className="bg-card rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5">
          <h2 className="text-xl font-semibold text-foreground">Riwayat 30 Hari Terakhir</h2>
        </div>
        
        {history.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">
            Belum ada riwayat absensi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-foreground/60 text-sm border-b border-primary/10 bg-primary/5">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Jam Masuk</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Koordinat (Lat, Lng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 text-foreground font-medium">{new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="p-4 font-mono text-primary">{h.jamMasuk?.substring(0, 5) || "-"}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary">
                        {h.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-foreground/50">
                      {h.latitude ? `${h.latitude.toFixed(5)}, ${h.longitude.toFixed(5)}` : "Tidak Terekam"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

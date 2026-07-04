"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center animate-pulse">
      <p className="text-primary font-mono animate-bounce">MEMUAT SISTEM RADAR SMK YASDA...</p>
    </div>
  ),
});

export default function KepsekDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const [permitModal, setPermitModal] = useState<{ isOpen: boolean; type: "Izin" | "Sakit" | null }>({ isOpen: false, type: null });
  const [keterangan, setKeterangan] = useState("");
  const [isSubmittingPermit, setIsSubmittingPermit] = useState(false);

  const SCHOOL_LAT = -7.014843;
  const SCHOOL_LNG = 106.545348;
  const RADIUS_METERS = 100;

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
        setUserLat(latitude);
        setUserLng(longitude);

        try {
          const res = await fetch("http://localhost:5150/api/attendance/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              latitude,
              longitude,
              isMockLocation: false
            })
          });
          let data: any = {};
          try { data = await res.json(); } catch (e) { }

          if (res.ok) {
            setMessage({ type: "success", text: "Absensi berhasil dicatat!" });
            fetchHistory();
          } else {
            setMessage({ type: "error", text: data.message || `Gagal absen (Error ${res.status}).` });
          }
        } catch (err) {
          setMessage({ type: "error", text: "Terjadi kesalahan server saat check-in." });
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

  const handlePermitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim()) return;

    setIsSubmittingPermit(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("http://localhost:5150/api/attendance/permit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: permitModal.type,
          keterangan: keterangan
        })
      });
      let data: any = {};
      try { data = await res.json(); } catch (e) { }

      if (res.ok) {
        setMessage({ type: "success", text: `Pengajuan ${permitModal.type} berhasil dicatat!` });
        setPermitModal({ isOpen: false, type: null });
        setKeterangan("");
        fetchHistory();
      } else {
        setMessage({ type: "error", text: data.message || `Gagal mengajukan ${permitModal.type} (Error ${res.status}).` });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan/server saat pengajuan." });
    } finally {
      setIsSubmittingPermit(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = history.some(h => h.tanggal.startsWith(todayStr));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

      {/* Modal Izin / Sakit */}
      {permitModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-primary/20 scale-in-center">
            <h3 className="text-xl font-bold mb-2">Pengajuan {permitModal.type}</h3>
            <p className="text-foreground/60 text-sm mb-6">Harap masukkan alasan atau keterangan dengan jelas.</p>

            <form onSubmit={handlePermitSubmit}>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mb-4 resize-none"
                placeholder={`Masukkan alasan ${permitModal.type}...`}
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPermitModal({ isOpen: false, type: null })}
                  className="flex-1 px-4 py-2 rounded-xl font-bold bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPermit || !keterangan.trim()}
                  className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all ${permitModal.type === 'Sakit' ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-amber-500 text-white hover:bg-amber-600'
                    } disabled:opacity-50`}
                >
                  {isSubmittingPermit ? "Memproses..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-3xl font-bold text-foreground">Ruang Absensi (Kepala Sekolah)</h1>
        <p className="text-foreground/60">Catat kehadiran Anda secara real-time di zona SMK YASDA.</p>
      </header>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="order-2 lg:order-1 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
          <DynamicMap
            schoolLat={SCHOOL_LAT}
            schoolLng={SCHOOL_LNG}
            radiusMeters={RADIUS_METERS}
            userLat={userLat}
            userLng={userLng}
          />
        </div>

        <div className="order-1 lg:order-2 bg-card p-8 rounded-3xl shadow-sm border border-primary/10 text-center relative overflow-hidden flex flex-col justify-center min-h-[350px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-6 mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 transition-colors shadow-[0_0_15px_rgba(92,161,103,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>

            <h2 className="text-2xl font-bold mb-2">Validasi SMK YASDA</h2>
            <p className="text-foreground/60 mb-8 max-w-sm mx-auto text-sm">
              Tekan tombol di bawah untuk mendeteksi koordinat Anda.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn || hasCheckedInToday}
                className={`px-8 py-4 w-full md:w-auto min-w-[250px] rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-primary/20 ${hasCheckedInToday
                  ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed shadow-none border border-foreground/10'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 border border-primary'
                  }`}
              >
                {isCheckingIn ? "MENDETEKSI LOKASI..." : hasCheckedInToday ? "SUDAH ABSEN" : "ABSEN SEKARANG"}
              </button>

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setPermitModal({ isOpen: true, type: "Izin" })}
                  disabled={hasCheckedInToday}
                  className="px-6 py-2 rounded-full font-bold text-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajukan Izin
                </button>
                <button
                  onClick={() => setPermitModal({ isOpen: true, type: "Sakit" })}
                  disabled={hasCheckedInToday}
                  className="px-6 py-2 rounded-full font-bold text-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lapor Sakit
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-primary/10 overflow-hidden mt-12">
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
                  <th className="p-4 font-medium">Keterangan / Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 text-foreground font-medium">{new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="p-4 font-mono text-primary">{h.jamMasuk?.substring(0, 5) || "-"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${h.status === 'Hadir' ? 'bg-primary/10 text-primary' :
                        h.status === 'Sakit' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {h.keterangan ? (
                        <span className="text-foreground/80 italic">"{h.keterangan}"</span>
                      ) : h.latitude ? (
                        <span className="font-mono text-foreground/50">{h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}</span>
                      ) : (
                        <span className="text-foreground/30">-</span>
                      )}
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

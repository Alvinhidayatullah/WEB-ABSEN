"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import EditProfileModal from "@/components/EditProfileModal";

const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] md:h-[500px] rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center animate-pulse">
      <p className="text-primary font-mono animate-bounce">MEMUAT SISTEM RADAR SMK YASDA...</p>
    </div>
  ),
});

const SCHOOL_LAT = -7.014843;
const SCHOOL_LNG = 106.545348;
const RADIUS_METERS = 300;

async function generateTamperSignature(lat: number, lng: number): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_TAMPER_SECRET;
  if (!secret) return "";
  const payload = `${lat},${lng}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return btoa(hashArray.map(b => String.fromCharCode(b)).join(''));
}

function formatTimeSpan(pt: string) {
  if (!pt) return "-";
  if (!pt.startsWith('PT')) return pt.length >= 8 ? pt.substring(0, 8) : pt;
  const hMatch = pt.match(/(\d+)H/);
  const mMatch = pt.match(/(\d+)M/);
  const sMatch = pt.match(/(\d+(?:\.\d+)?)S/);
  const h = hMatch ? hMatch[1].padStart(2, '0') : '00';
  const m = mMatch ? mMatch[1].padStart(2, '0') : '00';
  const s = sMatch ? parseInt(sMatch[1]).toString().padStart(2, '0') : '00';
  return `${h}:${m}:${s}`;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function KepsekDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [checkInStep, setCheckInStep] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [permitModal, setPermitModal] = useState<{ isOpen: boolean; type: "Izin" | "Sakit" | null }>({ isOpen: false, type: null });
  const [keterangan, setKeterangan] = useState("");
  const [isSubmittingPermit, setIsSubmittingPermit] = useState(false);
  const [locationError, setLocationError] = useState<string | null>("Memeriksa akses lokasi GPS...");
  const [profile, setProfile] = useState<{ nama: string } | null>(null);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocationError(null);
          const { latitude, longitude, accuracy } = pos.coords;
          setUserLat(latitude);
          setUserLng(longitude);
          setUserAccuracy(accuracy);
          setUserDistance(haversineDistance(latitude, longitude, SCHOOL_LAT, SCHOOL_LNG));
        },
        (err) => {
          setLocationError("Akses lokasi ditolak atau tidak tersedia. Wajib aktifkan GPS/Lokasi untuk menggunakan aplikasi.");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Perangkat atau browser Anda tidak mendukung GPS.");
    }
  }, []);

  // Background Tracker untuk mendeteksi anomali jarak dan waktu jika Fake GPS tiba-tiba dinyalakan
  useEffect(() => {
    if (userLat === null || userLng === null) return;
    const intervalId = setInterval(() => {
      fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `mutation Track($lat: Float!, $lng: Float!) { trackLocation(latitude: $lat, longitude: $lng) }`,
          variables: { lat: userLat, lng: userLng }
        })
      }).catch(() => {});
    }, 30000); // Kirim lokasi asli diam-diam tiap 30 detik
    return () => clearInterval(intervalId);
  }, [userLat, userLng]);

  async function fetchHistory() {
    try {
      const GRAPHQL_URL = "/api/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: `query { me { tanggal jamMasuk status latitude longitude isMockLocation keterangan } myProfile { nama } }` })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.me) setHistory(json.data.me);
        if (json.data?.myProfile) setProfile(json.data.myProfile);
      }
    } catch (err) { console.error(err); }
  }

  async function getSampledPosition(): Promise<{ lat: number; lng: number; accuracy: number; isMock: boolean }> {
    return new Promise((resolve, reject) => {
      const samples: { lat: number; lng: number; accuracy: number; ts: number, ttf: number }[] = [];
      let attempts = 0;
      const MAX_SAMPLES = 5; // Ditingkatkan dari 3 ke 5 untuk deteksi jitter

      const collectSample = () => {
        const startTime = Date.now();
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const timeToFix = Date.now() - startTime;
            attempts++;
            setCheckInStep(`Mengambil sampel GPS ${attempts}/${MAX_SAMPLES}...`);
            samples.push({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              ts: pos.timestamp,
              ttf: timeToFix
            });

            if (samples.length >= 2) {
              const s1 = samples[samples.length - 2];
              const s2 = samples[samples.length - 1];
              const dist = haversineDistance(s1.lat, s1.lng, s2.lat, s2.lng);
              const timeSec = Math.max((s2.ts - s1.ts) / 1000, 0.1);
              const speedKmh = (dist / timeSec) * 3.6;
              if (speedKmh > 50) {
                reject(new Error("Anomali terdeteksi: perpindahan GPS tidak wajar (>50 km/jam). Kemungkinan Fake GPS."));
                return;
              }
            }

            if (samples.length >= MAX_SAMPLES) {
              const avgLat = samples.reduce((s, x) => s + x.lat, 0) / samples.length;
              const avgLng = samples.reduce((s, x) => s + x.lng, 0) / samples.length;
              const avgAcc = samples.reduce((s, x) => s + x.accuracy, 0) / samples.length;

              if (avgAcc > 50) {
                reject(new Error(`Sinyal GPS lemah (akurasi: ${Math.round(avgAcc)}m). Pindah ke tempat lebih terbuka.`));
                return;
              }

              const maxSpread = Math.max(...samples.map(s => haversineDistance(s.lat, s.lng, avgLat, avgLng)));
              
              // === ANTI-CHEAT: MICRO-JITTER & PERFECT ACCURACY ANOMALY ===
              if (maxSpread === 0) {
                reject(new Error("⛔ Fake GPS Terdeteksi (Sinyal Terkunci Statis). Harap matikan aplikasi lokasi palsu!"));
                return;
              }

              const firstAcc = samples[0].accuracy;
              const isAccuracyIdentical = samples.every(s => s.accuracy === firstAcc);
              
              // Cek TTF (Time To Fix). Jika instan (< 50ms) di semua sampel + akurasi identik, itu Fake GPS baca cache memory.
              const allInstantFix = samples.every(s => s.ttf < 50);
              
              if ((maxSpread < 0.1 || allInstantFix) && isAccuracyIdentical) {
                reject(new Error("⛔ Fake GPS Terdeteksi (Respons instan tidak wajar). Harap matikan aplikasi lokasi palsu!"));
                return;
              }

              if (maxSpread > 10) {
                reject(new Error(`Koordinat GPS tidak stabil (variasi ${Math.round(maxSpread)}m). Pindah ke ruang terbuka.`));
                return;
              }

              const gpsAge = (Date.now() - samples[0].ts) / 1000;
              if (gpsAge > 60) {
                reject(new Error("Data GPS terlalu lama (>60 detik). Kemungkinan cache/manipulasi lokasi."));
                return;
              }

              if (avgLat < -11 || avgLat > 6 || avgLng < 95 || avgLng > 141) {
                reject(new Error("Koordinat GPS tidak masuk akal (luar wilayah Indonesia). Fake GPS terdeteksi."));
                return;
              }

              resolve({ lat: avgLat, lng: avgLng, accuracy: avgAcc, isMock: false });
            } else {
              setTimeout(collectSample, 1200);
            }
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              reject(new Error("Anda harus mengizinkan akses lokasi untuk bisa absen."));
            } else {
              reject(new Error("Gagal mendapatkan lokasi GPS. Pastikan GPS aktif."));
            }
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      };

      collectSample();
    });
  }

  const handleCheckIn = async () => {
    setMessage({ type: "", text: "" });
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Browser Anda tidak mendukung Geolocation." });
      return;
    }
    setIsCheckingIn(true);
    setCheckInStep("Memulai validasi GPS multi-sampel...");
    try {
      const { lat, lng, accuracy, isMock } = await getSampledPosition();
      setUserLat(lat);
      setUserLng(lng);
      setUserAccuracy(accuracy);
      setUserDistance(haversineDistance(lat, lng, SCHOOL_LAT, SCHOOL_LNG));
      setCheckInStep("Mengirim ke server untuk verifikasi akhir...");
      const signature = await generateTamperSignature(lat, lng);
      const GRAPHQL_URL = "/api/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Tamper-Signature": signature
        },
        credentials: "include",
        body: JSON.stringify({
          query: `mutation CheckIn($lat: Float, $lng: Float, $isMock: Boolean!, $accuracy: Float) {
            checkIn(latitude: $lat, longitude: $lng, isMockLocation: $isMock, accuracy: $accuracy) { message success }
          }`,
          variables: { lat, lng, isMock, accuracy }
        })
      });
      const json = await res.json();
      if (json.errors) {
        setMessage({ type: "error", text: json.errors[0]?.message || "Gagal absen." });
      } else if (json.data?.checkIn) {
        if (json.data.checkIn.success) {
          setMessage({ type: "success", text: json.data.checkIn.message });
          fetchHistory();
        } else {
          setMessage({ type: "error", text: json.data.checkIn.message });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat validasi lokasi." });
    } finally {
      setIsCheckingIn(false);
      setCheckInStep("");
    }
  };

  const handlePermitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim()) return;
    setIsSubmittingPermit(true);
    setMessage({ type: "", text: "" });
    try {
      const GRAPHQL_URL = "/api/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `mutation SubmitPermit($status: String!, $keterangan: String!) { submitPermit(status: $status, keterangan: $keterangan) { message success } }`,
          variables: { status: permitModal.type, keterangan }
        })
      });
      const json = await res.json();
      if (json.errors) {
        setMessage({ type: "error", text: json.errors[0]?.message || `Gagal mengajukan ${permitModal.type}.` });
      } else if (json.data?.submitPermit) {
        if (json.data.submitPermit.success) {
          setMessage({ type: "success", text: json.data.submitPermit.message });
          setPermitModal({ isOpen: false, type: null });
          setKeterangan("");
          fetchHistory();
        } else {
          setMessage({ type: "error", text: json.data.submitPermit.message });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan/server saat pengajuan." });
    } finally {
      setIsSubmittingPermit(false);
    }
  };

  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const todayStr = wibTime.toISOString().split('T')[0];
  const hasCheckedInToday = history.some(h => h.tanggal.startsWith(todayStr));

  return (
    <>
      {locationError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-2xl border border-destructive/20 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </div>
            <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight">Akses Lokasi Wajib Aktif</h2>
            <p className="text-foreground/70 mb-8">{locationError}</p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">Buka Pengaturan (Settings) perangkat/browser Anda dan izinkan Akses Lokasi.</p>
              <button onClick={() => window.location.reload()} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98]">
                Saya Sudah Aktifkan, Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative ${locationError ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Halo, {profile?.nama || "Kepala Sekolah"}! 👋</h1>
            <p className="text-foreground/60 text-sm mt-1">Selamat datang di Dasbor Kepala Sekolah.</p>
          </div>
          <button 
            onClick={() => setEditProfileModalOpen(true)} 
            className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors w-max"
          >
            Edit Profil
          </button>
        </div>

        {permitModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-primary/20">
              <h3 className="text-xl font-bold mb-2">Pengajuan {permitModal.type}</h3>
              <p className="text-foreground/60 text-sm mb-6">Harap masukkan alasan dengan jelas. Data akan direkam ke Kepala Sekolah.</p>
              <form onSubmit={handlePermitSubmit}>
                <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mb-4 resize-none"
                  placeholder={`Masukkan alasan ${permitModal.type}...`} required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPermitModal({ isOpen: false, type: null })}
                    className="flex-1 px-4 py-2 rounded-xl font-bold bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmittingPermit || !keterangan.trim()}
                    className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all ${permitModal.type === 'Sakit' ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-amber-500 text-white hover:bg-amber-600'} disabled:opacity-50`}>
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
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
            <DynamicMap schoolLat={SCHOOL_LAT} schoolLng={SCHOOL_LNG} radiusMeters={RADIUS_METERS}
              userLat={userLat} userLng={userLng} accuracy={userAccuracy} distance={userDistance} />
          </div>

          <div className="order-1 lg:order-2 bg-card p-8 rounded-3xl shadow-sm border border-primary/10 text-center relative overflow-hidden flex flex-col justify-center min-h-[350px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">Absensi Kepsek</h2>
              <p className="text-foreground/60 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                Sistem tervalidasi menggunakan GPS Anti-Cheat. Pastikan Anda berada dalam radius sekolah.
              </p>

              {userLat && (
                <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-foreground/5 rounded-xl p-2.5">
                    <div className="text-foreground/50 mb-0.5">Jarak ke Sekolah</div>
                    <div className={`font-bold font-mono text-sm ${userDistance !== null && userDistance !== undefined && userDistance <= RADIUS_METERS ? 'text-green-500' : 'text-red-500'}`}>
                      {userDistance !== null && userDistance !== undefined ? `${Math.round(userDistance)}m` : '-'}
                    </div>
                  </div>
                  <div className="bg-foreground/5 rounded-xl p-2.5">
                    <div className="text-foreground/50 mb-0.5">Akurasi GPS</div>
                    <div className={`font-bold font-mono text-sm ${!userAccuracy ? 'text-foreground/40' : userAccuracy <= 20 ? 'text-green-500' : userAccuracy <= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {userAccuracy ? `±${Math.round(userAccuracy)}m` : '-'}
                    </div>
                  </div>
                </div>
              )}

              {checkInStep && (
                <div className="mb-4 px-4 py-2 bg-primary/10 rounded-xl text-primary text-xs font-mono animate-pulse">{checkInStep}</div>
              )}

              <div className="space-y-4">
                <button onClick={handleCheckIn} disabled={isCheckingIn || hasCheckedInToday}
                  className={`px-8 py-3.5 w-full md:w-auto min-w-[240px] rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mx-auto ${hasCheckedInToday ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed border border-foreground/10' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 border border-primary shadow-lg shadow-primary/20'}`}>
                  {isCheckingIn ? (<><svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>MEMVALIDASI...</>) : hasCheckedInToday ? "SUDAH ABSEN HARI INI" : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                      ABSEN SEKARANG
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button onClick={() => setPermitModal({ isOpen: true, type: "Izin" })} disabled={hasCheckedInToday}
                    className="px-6 py-2 rounded-2xl font-bold text-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Ajukan Izin</button>
                  <button onClick={() => setPermitModal({ isOpen: true, type: "Sakit" })} disabled={hasCheckedInToday}
                    className="px-6 py-2 rounded-2xl font-bold text-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Lapor Sakit</button>
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
            <div className="p-8 text-center text-foreground/50">Belum ada riwayat absensi.</div>
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
                      <td className="p-4 font-mono text-primary">{formatTimeSpan(h.jamMasuk)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${h.status === 'Hadir' ? 'bg-primary/10 text-primary' : h.status === 'Sakit' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>{h.status}</span>
                      </td>
                      <td className="p-4 text-xs">
                        {h.keterangan ? (<span className="text-foreground/80 italic">"{h.keterangan}"</span>
                        ) : h.latitude ? (<span className="font-mono text-foreground/50">{h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}</span>
                        ) : (<span className="text-foreground/30">-</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <EditProfileModal 
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        currentNama={profile?.nama || ""}
        onSuccess={() => fetchHistory()}
      />
    </>
  );
}

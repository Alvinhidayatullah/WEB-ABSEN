"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalGuru: 0, hadirHariIni: 0, izinSakit: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:5150/api/attendance/today", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Gagal memuat statistik", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60">Ringkasan Sistem Hari Ini</p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-card h-32 rounded-2xl border border-primary/10" />
          <div className="bg-card h-32 rounded-2xl border border-primary/10" />
          <div className="bg-card h-32 rounded-2xl border border-primary/10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors">
            <h3 className="text-sm font-medium text-foreground/60 mb-1">Total Guru</h3>
            <p className="text-4xl font-bold text-foreground">{stats.totalGuru}</p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors">
            <h3 className="text-sm font-medium text-foreground/60 mb-1">Hadir Hari Ini</h3>
            <p className="text-4xl font-bold text-primary">{stats.hadirHariIni}</p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors">
            <h3 className="text-sm font-medium text-foreground/60 mb-1">Izin / Sakit</h3>
            <p className="text-4xl font-bold text-destructive">{stats.izinSakit}</p>
          </div>
        </div>
      )}
      
      <div className="bg-card h-64 rounded-2xl border border-primary/10 shadow-sm flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
        <p className="text-foreground/40 font-mono text-sm relative z-10">[ Visualisasi Data Geo-Lokasi Absensi ]</p>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Forbidden403() {
  const [ip, setIp] = useState<string>("MENDETEKSI...");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp("TIDAK DIKETAHUI (TERCATAT LOKAL)"));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(75,127,82,0.2)_3px,rgba(75,127,82,0.2)_3px)] mix-blend-screen" />
      
      <div className="z-10 text-center space-y-6 max-w-lg">
        <div className="mx-auto w-24 h-24 border-2 border-red-500/50 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-red-500 tracking-widest font-mono">
          AKSES DITOLAK
        </h1>
        
        <p className="text-red-500 font-mono text-lg tracking-wide uppercase animate-pulse">
          Anomali Keamanan Terdeteksi
        </p>
        
        <div className="text-left bg-red-950/30 p-6 rounded border border-red-500/30 font-mono space-y-3">
          <p className="text-red-400 font-bold text-sm">PERINGATAN SISTEM:</p>
          <p className="text-foreground/80 text-sm md:text-base leading-relaxed">
            Anda mencoba mengakses portal restricted tanpa otorisasi yang sah. Tindakan ilegal ini melanggar protokol keamanan kami.
          </p>
          <div className="mt-4 p-3 bg-black/60 border border-red-500/20 rounded">
            <p className="text-red-500 font-bold text-xs mb-1">DATA PELANGGAR:</p>
            <p className="text-foreground/90 font-mono text-sm">Alamat IP : <span className="text-red-400 font-bold">{ip}</span></p>
            <p className="text-foreground/90 font-mono text-sm">Status    : <span className="text-red-400 font-bold">TELAH DICATAT & DILAPORKAN</span></p>
          </div>
        </div>
        
        <div className="pt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-mono font-bold tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(75,127,82,0.3)] hover:shadow-[0_0_30px_rgba(75,127,82,0.5)] border border-primary/50"
          >
            KEMBALI KE HALAMAN AMAN
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

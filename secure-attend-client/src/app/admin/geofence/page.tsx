"use client";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center animate-pulse">
      <p className="text-primary font-mono animate-bounce">MEMUAT PUSAT KENDALI RADAR...</p>
    </div>
  ),
});

export default function GeofenceSystem() {
  const SCHOOL_LAT = -7.014843;
  const SCHOOL_LNG = 106.545348;
  const RADIUS_METERS = 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Sistem Geofence</h1>
        <p className="text-foreground/60">Pusat pengintaian parameter dan batas area presensi SMK YASDA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Info Parameter */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10">
            <h2 className="text-lg font-semibold mb-4 text-primary">Konfigurasi Radar Saat Ini</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <span className="block text-xs font-mono text-foreground/50 mb-1">TITIK PUSAT (LATITUDE)</span>
                <span className="font-bold text-foreground">{SCHOOL_LAT}</span>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <span className="block text-xs font-mono text-foreground/50 mb-1">TITIK PUSAT (LONGITUDE)</span>
                <span className="font-bold text-foreground">{SCHOOL_LNG}</span>
              </div>
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <span className="block text-xs font-mono text-green-500/70 mb-1">BATAS RADIUS ABSEN (METER)</span>
                <span className="font-bold text-green-500 text-xl">{RADIUS_METERS} m</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-500/90 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1 -mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Perubahan radius atau koordinat saat ini terkunci di level server C# untuk mencegah manipulasi. Hubungi System Administrator untuk mengubahnya.
              </p>
            </div>
          </div>
        </div>

        {/* Peta (Preview) */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-600 rounded-2xl blur opacity-25"></div>
          <DynamicMap 
            schoolLat={SCHOOL_LAT} 
            schoolLng={SCHOOL_LNG} 
            radiusMeters={RADIUS_METERS} 
          />
        </div>

      </div>
    </div>
  );
}

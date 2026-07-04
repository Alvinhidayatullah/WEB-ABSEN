"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const schoolIcon = new L.DivIcon({
  html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.5);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">🏫</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: '',
});

function makeUserIcon(isInside: boolean) {
  const color = isInside ? '#22c55e' : '#ef4444';
  const glow = isInside ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)';
  return new L.DivIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 4px ${glow},0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;animation:pulse-pin 1.8s infinite;"><span style="font-size:14px;">📍</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: '',
  });
}

interface MapProps {
  userLat?: number | null;
  userLng?: number | null;
  schoolLat: number;
  schoolLng: number;
  radiusMeters: number;
  accuracy?: number | null;
  distance?: number | null;
}

function FlyToUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

export default function Map({ userLat, userLng, schoolLat, schoolLng, radiusMeters, accuracy, distance }: MapProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Deteksi tema gelap dari class 'dark' di html atau preferensi sistem
    const checkTheme = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(hasDarkClass || prefersDark);
    };

    checkTheme(); // cek awal

    // Observer untuk mendeteksi perubahan class 'dark' pada <html> (jika pakai next-themes)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listener untuk perubahan preferensi sistem
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  const isInRadius = !!(userLat && userLng && distance !== null && distance !== undefined && distance <= radiusMeters);
  const geofenceColor = (userLat && userLng) ? (isInRadius ? '#22c55e' : '#ef4444') : (isDarkMode ? '#5ca167' : '#16a34a');

  const mapUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="flex flex-col gap-3 w-full relative z-20">
      {/* Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-500 ${!userLat ? 'bg-card border-primary/20 text-foreground/50' :
        isInRadius ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' :
          'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
        }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${!userLat ? 'bg-foreground/30' :
            isInRadius ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' :
              'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
            }`} />
          <span>
            {!userLat ? 'Menunggu sinyal GPS...' :
              isInRadius ? 'DALAM ZONA AMAN — Siap Absen' :
                'DI LUAR ZONA SEKOLAH'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-medium">
          {distance !== null && distance !== undefined && (
            <span className="flex items-center gap-1.5 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4-4"/><path d="M17 21l4-4"/><path d="M3 16l4-4"/><path d="M7 21l-4-4"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
              {Math.round(distance)}m
            </span>
          )}
          {accuracy !== null && accuracy !== undefined && (
            <span className={`flex items-center gap-1.5 ${accuracy <= 20 ? 'text-green-500' : accuracy <= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5 relative z-10">
        <style>{`
          @keyframes pulse-pin { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        `}</style>
        <MapContainer center={[schoolLat, schoolLng]} zoom={18} style={{ height: '100%', width: '100%' }} attributionControl={false}>
          <TileLayer key={isDarkMode ? 'dark' : 'light'} url={mapUrl} maxZoom={22} />

          {/* Zona aura luar */}
          <Circle center={[schoolLat, schoolLng]} radius={radiusMeters * 1.8}
            pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.04, weight: 0 }} />

          {/* Geofence utama */}
          <Circle center={[schoolLat, schoolLng]} radius={radiusMeters}
            pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.15, weight: 2.5, dashArray: "6, 8" }}>
            <Popup>
              <strong>Zona Absensi SMK YASDA</strong><br />
              Radius: {radiusMeters}m<br />
              {userLat && distance !== undefined && distance !== null ? (
                <span style={{ color: isInRadius ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                  Jarak Anda: {Math.round(distance)}m — {isInRadius ? '✅ AMAN' : '⛔ DI LUAR'}
                </span>
              ) : 'Lokasi belum terdeteksi'}
            </Popup>
          </Circle>

          {/* Marker Sekolah */}
          <Marker position={[schoolLat, schoolLng]} icon={schoolIcon}>
            <Popup><strong>🏫 SMK YASDA</strong><br />Pusat Zona Absensi</Popup>
          </Marker>

          {/* Marker & akurasi user */}
          {userLat && userLng && (
            <>
              {accuracy && (
                <Circle center={[userLat, userLng]} radius={accuracy}
                  pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.08, weight: 1, dashArray: "3, 6" }} />
              )}
              <Marker position={[userLat, userLng]} icon={makeUserIcon(isInRadius)}>
                <Popup>
                  <strong>📍 Posisi Anda</strong><br />
                  <span style={{ color: isInRadius ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    {isInRadius ? 'Dalam Zona Aman' : 'Di Luar Zona!'}
                  </span><br />
                  Jarak: <strong>{distance !== null && distance !== undefined ? `${Math.round(distance)} m` : 'N/A'}</strong><br />
                  Akurasi: <strong>{accuracy ? `±${Math.round(accuracy)} m` : 'N/A'}</strong>
                </Popup>
              </Marker>
              <FlyToUser lat={userLat} lng={userLng} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

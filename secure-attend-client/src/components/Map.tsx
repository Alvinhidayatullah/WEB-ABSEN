"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix custom marker icon issues in Leaflet with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon untuk user (Guru)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  userLat?: number | null;
  userLng?: number | null;
  schoolLat: number;
  schoolLng: number;
  radiusMeters: number;
}

function FlyToUser({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

export default function Map({ userLat, userLng, schoolLat, schoolLng, radiusMeters }: MapProps) {
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');

  // Peta terang (default) dan gelap CartoDB
  const lightMapUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const darkMapUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  
  // Hitung jarak murni di client untuk visualisasi (opsional)
  let isInRadius = false;
  if (userLat && userLng) {
    const from = L.latLng(userLat, userLng);
    const to = L.latLng(schoolLat, schoolLng);
    isInRadius = from.distanceTo(to) <= radiusMeters;
  }

  return (
    <div className="flex flex-col gap-3 w-full relative z-20">
      {/* Tombol diletakkan di luar area peta agar lebih jelas dan tidak mengganggu */}
      <div className="flex justify-end w-full">
        <button 
          onClick={() => setMapTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 rounded-xl shadow-sm text-sm font-bold transition-transform active:scale-95 flex items-center gap-2 border border-primary/20 bg-card hover:bg-primary/10 text-foreground"
        >
          {mapTheme === 'light' ? '🌙 Gunakan Peta Gelap' : '☀️ Gunakan Peta Terang'}
        </button>
      </div>

      <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5 relative z-10">
        <MapContainer 
          center={[schoolLat, schoolLng]} 
          zoom={17} 
          style={{ height: '100%', width: '100%', backgroundColor: mapTheme === 'dark' ? '#0f1411' : '#f5f5f5' }}
          attributionControl={false}
        >
          <TileLayer url={mapTheme === 'light' ? lightMapUrl : darkMapUrl} />
        
        {/* Lingkaran Radius Sekolah (Geofence) */}
        <Circle 
          center={[schoolLat, schoolLng]} 
          radius={radiusMeters} 
          pathOptions={{ 
            color: '#5ca167', 
            fillColor: '#5ca167', 
            fillOpacity: 0.15,
            weight: 2,
            dashArray: "5, 10" // Efek garis putus-putus seperti radar
          }} 
        >
          <Popup>Zona Absensi SMK YASDA (Radius: {radiusMeters}m)</Popup>
        </Circle>

        {/* Titik Pusat Sekolah */}
        <Marker position={[schoolLat, schoolLng]}>
          <Popup><strong>SMK YASDA</strong><br/>Titik Pusat Sekolah</Popup>
        </Marker>

        {/* Titik Pengguna (Jika lokasi sudah dideteksi) */}
        {userLat && userLng && (
          <>
            <Marker position={[userLat, userLng]} icon={userIcon}>
              <Popup>
                <strong>Posisi Anda</strong><br/>
                {isInRadius ? (
                  <span className="text-green-600 font-bold">Dalam Zona Aman</span>
                ) : (
                  <span className="text-red-600 font-bold">Di Luar Zona Sekolah!</span>
                )}
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

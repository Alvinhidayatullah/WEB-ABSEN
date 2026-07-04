"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center animate-pulse">
      <p className="text-primary font-mono animate-bounce">MEMUAT PUSAT KENDALI RADAR...</p>
    </div>
  ),
});

export default function DynamicMap(props: any) {
  return <Map {...props} />;
}

export default function KepsekPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-primary/20">
        <h1 className="text-2xl font-bold mb-4 text-primary">Portal Kepala Sekolah</h1>
        <p className="text-foreground/80 mb-6">
          Selamat datang, KEPALA_SEKOLAH. Anda dapat melihat laporan absensi di sini.
        </p>
        <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          LIHAT LAPORAN
        </button>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function KepsekEvaluasi() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter Bulan & Tahun
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  async function fetchData(month: number, year: number) {
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`http://localhost:5150/api/attendance/all?month=${month}&year=${year}`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengambil data dari server." });
    } finally {
      setIsLoading(false);
    }
  }

  // Ekspor ke Excel
  const handleExportExcel = async () => {
    if (data.length === 0) return;

    // Load XLSX dynamically to keep bundle size small on initial load
    const XLSX = await import('xlsx');

    // Header Excel
    const headers = ["Tanggal", "Nama", "Status", "Keterangan/Waktu"];
    
    // Baris Excel
    const excelRows = data.map(row => {
      return [
        row.tanggal.split('T')[0],
        row.nama,
        row.status,
        row.status === 'Hadir' ? row.jamMasuk : (row.keterangan || "-")
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluasi Absensi");
    
    XLSX.writeFile(workbook, `Evaluasi_Absensi_${selectedYear}_${selectedMonth}.xlsx`);
  };

  // Hapus Data (Storage Optimization)
  const handleDeleteMonth = async () => {
    if (!window.confirm(`PERINGATAN BAHAYA!\n\nAnda yakin ingin MENGHAPUS SEMUA DATA absensi pada bulan ${selectedMonth} tahun ${selectedYear} secara permanen?\n\nTindakan ini biasanya hanya dilakukan untuk menghemat ruang penyimpanan. Pastikan Anda sudah mengunduh (Export) datanya terlebih dahulu!`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:5150/api/attendance/month/${selectedYear}/${selectedMonth}`, {
        method: "DELETE",
        credentials: "include"
      });
      const resData = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: resData.message });
        fetchData(selectedMonth, selectedYear); // Refresh data yang seharusnya kosong
      } else {
        setMessage({ type: "error", text: resData.message || "Gagal menghapus data." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan server saat menghapus." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evaluasi Absensi</h1>
          <p className="text-foreground/60">Pantau, unduh, dan kelola rekaman kehadiran seluruh staf.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={data.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Unduh Excel
          </button>
          
          <button
            onClick={handleDeleteMonth}
            disabled={isDeleting || data.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            {isDeleting ? "Menghapus..." : "Bersihkan"}
          </button>
        </div>
      </header>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        {/* Panel Filter */}
        <div className="p-6 border-b border-primary/5 bg-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
            Data Kehadiran & Izin
          </h2>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium flex-1 sm:flex-none"
            >
              <option value={1}>Januari</option>
              <option value={2}>Februari</option>
              <option value={3}>Maret</option>
              <option value={4}>April</option>
              <option value={5}>Mei</option>
              <option value={6}>Juni</option>
              <option value={7}>Juli</option>
              <option value={8}>Agustus</option>
              <option value={9}>September</option>
              <option value={10}>Oktober</option>
              <option value={11}>November</option>
              <option value={12}>Desember</option>
            </select>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium flex-1 sm:flex-none"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>
        </div>
        
        {/* Super Tabel */}
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <svg className="animate-spin mx-auto h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-foreground/50 animate-pulse">Menarik data dari database...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-foreground/50">
            <p>Tidak ada data absensi pada periode yang dipilih.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-foreground/60 text-sm border-b border-primary/10">
                  <th className="p-4 font-medium whitespace-nowrap">Tanggal</th>
                  <th className="p-4 font-medium whitespace-nowrap">Nama & ID</th>
                  <th className="p-4 font-medium whitespace-nowrap">Status</th>
                  <th className="p-4 font-medium whitespace-nowrap">Keterangan / Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 font-mono text-primary whitespace-nowrap">
                      {row.tanggal.split('T')[0]}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{row.nama}</div>
                      <div className="text-xs text-foreground/50 font-mono mt-0.5">{row.username}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        row.status === 'Hadir' ? 'bg-primary/10 text-primary' : 
                        row.status === 'Sakit' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.status === 'Hadir' ? (
                        <div className="text-primary font-mono bg-primary/5 inline-block px-2 py-1 rounded">
                          Jam Masuk: {row.jamMasuk}
                        </div>
                      ) : (
                        <div className="text-foreground/80 text-xs italic max-w-xs truncate" title={row.keterangan}>
                          "{row.keterangan}"
                        </div>
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

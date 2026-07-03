"use client";
import { useEffect, useState } from "react";

export default function KelolaGuru() {
  const [gurus, setGurus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ username: "", nama: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchGurus();
  }, []);

  async function fetchGurus() {
    try {
      const res = await fetch("http://localhost:5150/api/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGurus(data.filter((u: any) => u.role === "GURU"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("http://localhost:5150/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, role: "GURU" })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Guru berhasil ditambahkan!" });
        setForm({ username: "", nama: "", password: "" });
        fetchGurus(); // Refresh list
      } else {
        setMessage({ type: "error", text: data.message || "Gagal menambahkan guru." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Koneksi ke server gagal." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Kelola Guru</h1>
        <p className="text-foreground/60">Tambah dan pantau akses untuk para pengajar.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Tambah Guru */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10 sticky top-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Tambah Baru</h2>
            
            {message.text && (
              <div className={`p-3 mb-4 rounded-xl text-sm border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">NIP / ID</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({...form, nama: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Kata Sandi Awal</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? "MENYIMPAN..." : "TAMBAHKAN"}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Guru */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
            <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-primary/5">
              <h2 className="text-xl font-semibold text-foreground">Daftar Pengajar Terdaftar</h2>
              <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{gurus.length} Total</span>
            </div>
            
            {isLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
              </div>
            ) : gurus.length === 0 ? (
              <div className="p-12 text-center text-foreground/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p>Belum ada guru yang didaftarkan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-foreground/60 text-sm border-b border-primary/10">
                      <th className="p-4 font-medium">NIP/ID</th>
                      <th className="p-4 font-medium">Nama Lengkap</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5 text-sm">
                    {gurus.map((g, i) => (
                      <tr key={i} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-mono text-primary">{g.username}</td>
                        <td className="p-4 font-medium text-foreground">{g.nama}</td>
                        <td className="p-4">
                          {g.statusAktif ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                              Nonaktif
                            </span>
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

      </div>
    </div>
  );
}

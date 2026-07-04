"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const graphqlQuery = {
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              message
              user { role }
            }
          }
        `,
        variables: { username, password }
      };

      const res = await fetch("http://localhost:5150/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // PENTING: Untuk menerima Set-Cookie dari backend
        body: JSON.stringify(graphqlQuery)
      });

      const json = await res.json();
      
      if (json.errors) {
        setError(json.errors[0]?.message || "Gagal masuk. Periksa kembali ID dan Kata Sandi.");
      } else if (json.data && json.data.login) {
        // Berhasil login, arahkan berdasarkan role
        const role = json.data.login.user?.role;
        if (role === "SUPER_ADMIN") {
          router.push("/admin");
        } else if (role === "KEPALA_SEKOLAH") {
          router.push("/kepsek");
        } else {
          router.push("/teacher");
        }
      } else {
        setError("Gagal masuk. Respons tidak valid.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="relative mx-auto w-24 h-24 mb-8">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
            {/* Glassmorphic Container */}
            <div className="relative w-full h-full bg-gradient-to-br from-card to-background rounded-[2rem] border border-primary/20 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(75,127,82,0.4)] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              {/* Ruang (Pin Lokasi) & Hadir (Ceklis) Logo */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-primary relative z-10 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(75,127,82,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" className="stroke-primary/40" />
                <path d="M9 10l2 2 4-4" strokeWidth="3" className="stroke-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 font-sans text-center">
            <span className="text-foreground">Ruang</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-emerald-400 to-cyan-500 drop-shadow-[0_0_15px_rgba(75,127,82,0.2)]">Hadir</span>
          </h1>
          
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50"></div>
            <p className="text-xs md:text-sm font-mono text-foreground/70 uppercase tracking-widest text-center">
              Ruang Khusus & Aman Bagi Guru
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50"></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-lg shadow-primary/5 border border-primary/10">
          <form className="space-y-4" onSubmit={handleLogin}>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="nip" className="block text-sm font-medium text-foreground/80">
                NIP / Username
              </label>
              <input
                id="nip"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIP atau Username"
                className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="pin" className="block text-sm font-medium text-foreground/80">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-transform active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? "MEMPROSES..." : "MASUK"}</span>
                {!isLoading && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

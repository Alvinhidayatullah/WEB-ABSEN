"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function KepsekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:5150/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      router.push("/");
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar untuk Desktop / Navbar bawah untuk Mobile */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-primary/10 flex md:flex-col p-4 md:p-6 shadow-sm z-20 sticky top-0 md:h-screen">
        <div className="flex-1 flex justify-between md:justify-start items-center md:items-start md:flex-col w-full">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary">SecureAttend</h2>
            <p className="hidden md:block text-xs text-foreground/50 mb-8 font-mono">PORTAL KEPSEK</p>
          </div>
          
          <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto w-full">
            <Link 
              href="/kepsek" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                pathname === "/kepsek" 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground/70 hover:bg-card-hover hover:text-primary"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
              <span className="hidden md:inline">Panel Absensi</span>
            </Link>
            <Link 
              href="/kepsek/evaluasi" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                pathname.startsWith("/kepsek/evaluasi") 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground/70 hover:bg-card-hover hover:text-primary"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span className="hidden md:inline">Evaluasi Bulanan</span>
            </Link>
            {/* Tombol Keluar untuk Mobile */}
            <button 
              onClick={handleLogout}
              className="md:hidden flex items-center justify-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-colors whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              <span>Keluar</span>
            </button>
          </nav>
        </div>
        
        <div className="hidden md:block pt-6 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

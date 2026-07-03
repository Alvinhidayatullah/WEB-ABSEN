export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar untuk Desktop / Navbar bawah untuk Mobile */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-primary/10 flex md:flex-col p-4 md:p-6 shadow-sm z-10 sticky top-0 md:h-screen">
        <div className="flex-1 flex justify-between items-center md:items-start md:flex-col">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary">SecureAttend</h2>
            <p className="hidden md:block text-xs text-foreground/50 mb-8 font-mono">PORTAL GURU</p>
          </div>
          
          <nav className="flex space-x-2 md:space-x-0 md:space-y-2">
            <a href="/teacher" className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
              <span className="hidden md:inline">Panel Absensi</span>
            </a>
          </nav>
        </div>
        
        <div className="hidden md:block pt-6 mt-auto">
          <a href="/" className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Keluar
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

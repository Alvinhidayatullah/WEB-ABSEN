import Link from "next/link";

export default function Forbidden403() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(75,127,82,0.2)_3px,rgba(75,127,82,0.2)_3px)] mix-blend-screen" />
      
      <div className="z-10 text-center space-y-6 max-w-lg">
        <div className="mx-auto w-24 h-24 border-2 border-red-500/50 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-red-500 tracking-widest font-mono">
          ACCESS DENIED
        </h1>
        
        <p className="text-primary font-mono text-lg tracking-wide uppercase">
          Anomaly Detected
        </p>
        
        <p className="text-foreground/60 text-sm md:text-base font-mono bg-black/50 p-4 rounded border border-red-500/20">
          Security policy enforced: You do not have the required permissions to access this specific portal. Your attempt has been logged.
        </p>
        
        <div className="pt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-mono font-bold tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(75,127,82,0.3)] hover:shadow-[0_0_30px_rgba(75,127,82,0.5)] border border-primary/50"
          >
            RETURN TO SAFETY
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

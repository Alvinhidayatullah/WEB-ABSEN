"use client";
import { useState } from "react";

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  currentNama, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentNama: string;
  onSuccess: () => void;
}) {
  const [nama, setNama] = useState(currentNama || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `mutation UpdateProfile($nama: String, $currPass: String, $newPass: String) {
            updateProfile(nama: $nama, currentPassword: $currPass, newPassword: $newPass) { message success }
          }`,
          variables: { nama, currPass: currentPassword, newPass: newPassword }
        })
      });
      const json = await res.json();
      if (json.errors) {
        setMessage({ type: "error", text: json.errors[0]?.message || "Gagal memperbarui profil." });
      } else if (json.data?.updateProfile) {
        if (json.data.updateProfile.success) {
          setMessage({ type: "success", text: json.data.updateProfile.message });
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setMessage({ type: "error", text: json.data.updateProfile.message });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan sistem." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl border border-primary/20 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-1">Edit Profil</h3>
        <p className="text-foreground/60 text-sm mb-6">Ubah nama atau password Anda di bawah ini.</p>
        
        {message.text && (
          <div className={`p-3 rounded-xl text-sm font-medium mb-4 border ${message.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 ml-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={nama}
              onChange={e => setNama(e.target.value)}
              className="w-full bg-background border border-primary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          
          <div className="pt-2 border-t border-primary/10">
            <p className="text-xs text-foreground/50 mb-3 ml-1">Kosongkan sandi baru jika tidak ingin ganti sandi.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5 ml-1">Sandi Saat Ini (Wajib jika ganti sandi)</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-background border border-primary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30"
                  placeholder="Masukkan sandi lama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5 ml-1">Sandi Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-primary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30"
                  placeholder="Masukkan sandi baru"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

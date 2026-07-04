"use client";
import { useEffect, useState } from "react";

export default function KelolaPengguna() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ username: "", nama: "", password: "", role: "GURU" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const graphqlQuery = { query: `query { users { id username nama role statusAktif isDeletable } }` };
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:5150/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(graphqlQuery)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.users) {
          setUsers(json.data.users);
        }
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
      const graphqlQuery = {
        query: `mutation CreateUser($username: String!, $nama: String!, $password: String!, $role: String!) {
          createUser(username: $username, nama: $nama, password: $password, role: $role) { message success }
        }`,
        variables: form
      };
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:5150/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(graphqlQuery)
      });
      const json = await res.json();
      if (json.errors) {
        setMessage({ type: "error", text: json.errors[0]?.message || "Gagal menambahkan pengguna." });
      } else if (json.data && json.data.createUser) {
        if (json.data.createUser.success) {
          setMessage({ type: "success", text: json.data.createUser.message });
          setForm({ username: "", nama: "", password: "", role: "GURU" });
          fetchUsers();
        } else {
          setMessage({ type: "error", text: json.data.createUser.message });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Koneksi ke server gagal." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus akun ini? Data yang terhapus tidak bisa dikembalikan!")) {
      return;
    }

    try {
      const graphqlQuery = {
        query: `mutation DeleteUser($id: Int!) { deleteUser(id: $id) { message success } }`,
        variables: { id }
      };
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:5150/graphql";
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(graphqlQuery)
      });
      const json = await res.json();
      if (json.errors) {
        setMessage({ type: "error", text: json.errors[0]?.message || "Gagal menghapus akun." });
      } else if (json.data && json.data.deleteUser) {
        if (json.data.deleteUser.success) {
          setMessage({ type: "success", text: json.data.deleteUser.message });
          fetchUsers();
        } else {
          setMessage({ type: "error", text: json.data.deleteUser.message });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Koneksi ke server gagal saat menghapus." });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Kelola Pengguna</h1>
        <p className="text-foreground/60">Tambah, pantau, dan cabut akses untuk semua level sistem.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Form Tambah Pengguna */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-primary/10 sticky top-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Tambah Akun Baru</h2>

            {message.text && (
              <div className={`p-3 mb-4 rounded-xl text-sm border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Role Sistem</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                >
                  <option value="GURU">Guru</option>
                  <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Username / ID Login</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Kata Sandi Awal</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? "MENYIMPAN..." : "BUAT AKUN"}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Pengguna */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
            <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-primary/5">
              <h2 className="text-xl font-semibold text-foreground">Daftar Pengguna Terdaftar</h2>
              <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{users.length} Total</span>
            </div>

            {isLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-primary/5 animate-pulse rounded-xl" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-foreground/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                <p>Belum ada pengguna yang didaftarkan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-foreground/60 text-sm border-b border-primary/10">
                      <th className="p-4 font-medium">Username</th>
                      <th className="p-4 font-medium">Nama Lengkap</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5 text-sm">
                    {users.map((u, i) => (
                      <tr key={i} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-mono text-primary">{u.username}</td>
                        <td className="p-4 font-medium text-foreground">{u.nama}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium 
                            ${u.role === 'SUPER_ADMIN' ? 'bg-amber-500/10 text-amber-500' :
                              u.role === 'KEPALA_SEKOLAH' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-primary/10 text-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {u.username !== "vinz_admin" ? (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors text-xs font-bold"
                              title="Hapus permanen akun ini"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                              Hapus
                            </button>
                          ) : (
                            <span className="text-xs text-foreground/40 font-medium px-3 py-1.5 border border-dashed border-foreground/20 rounded-lg">Administrator</span>
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

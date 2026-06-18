import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/prodify/Logo";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, User as UserIcon, Lock, Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const { setCurrentUser, bootstrap } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    const trimmedUser = username.trim();

    if (!trimmedUser) {
      nextErrors.username = "Nama Pengguna tidak boleh kosong";
    }

    if (!password) {
      nextErrors.password = "Kata Sandi tidak boleh kosong";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.username) usernameRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password }),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text) } catch { data = { error: text } }

      if (!res.ok) {
        setErrors({ general: data.error || "Nama Pengguna atau Kata Sandi salah!" });
        usernameRef.current?.focus();
        setLoading(false);
        return;
      }

      await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.refreshToken,
      })

      setCurrentUser(data.user, data.token);
      sessionStorage.setItem('knitflow-tab-session', 'true');

      bootstrap();

      toast.success(`Selamat datang, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
      
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: "Gagal terhubung ke server. Pastikan backend running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-secondary-foreground relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-primary-glow/20 blur-3xl" />
        <Logo size="lg" />
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Sistem Informasi Manajemen Produksi
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Kelola produksi rajut <span className="text-primary">handmade</span> dengan rapi & real-time.
          </h1>
          <p className="text-secondary-foreground/80 leading-relaxed">
            Pusatkan pesanan, distribusikan tugas ke pengrajin di rumah masing-masing, pantau stok, dan hitung upah otomatis berdasarkan poin.
          </p>
        </div>
        <p className="relative text-xs text-secondary-foreground/60">© {new Date().getFullYear()} RieFa Collection</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo size="lg" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Masuk ke akun Anda</h2>
          </div>

          <Card className="p-6 shadow-[var(--shadow-card)]">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errors.general && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className={errors.username ? "text-destructive" : ""}>
                  Nama Pengguna
                </Label>
                <div className="relative">
                  <UserIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                      errors.username ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="username"
                    ref={usernameRef}
                    autoComplete="username"
                    placeholder="mis. admin"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username || errors.general) setErrors((prev) => ({ ...prev, username: undefined, general: undefined }));
                    }}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? "username-error" : undefined}
                    className={`pl-9 ${
                      errors.username
                        ? "border-destructive focus-visible:ring-destructive pr-9"
                        : ""
                    }`}
                  />
                  {errors.username && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {errors.username && (
                  <p id="username-error" className="text-xs font-medium text-destructive">
                    {errors.username}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                      errors.password ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="password"
                    ref={passwordRef}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.general) setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`pl-9 ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive pr-9"
                        : ""
                    }`}
                  />
                  {errors.password && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {errors.password && (
                  <div className="flex items-center justify-between gap-2">
                    <p id="password-error" className="text-xs font-medium text-destructive">
                      {errors.password}
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.info("Hubungi admin untuk reset Kata Sandi Anda.")}
                      className="text-xs font-medium text-secondary hover:text-secondary/80 underline-offset-2 hover:underline"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2 h-11 font-semibold">
                <LogIn className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Masuk"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

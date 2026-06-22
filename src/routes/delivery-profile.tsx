import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Truck, User as UserIcon, Phone, Lock, Save, Eye, EyeOff, Check, ShieldAlert, ArrowLeft } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/delivery-profile")({ component: DeliveryProfilePage });

const inp = "mt-1 w-full flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:shadow-[var(--shadow-soft)]";

function DeliveryProfilePage() {
  const { user, updateProfile, changePassword } = useSupabaseStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user?.id]);

  if (!user || user.role !== "delivery") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Delivery agents only</h1>
          <Link to="/staff-login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Staff Login
          </Link>
        </div>
      </PageShell>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if (!name.trim()) { setProfileError("Name cannot be empty."); return; }
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      setProfileError(err?.message ?? "Failed to save profile.");
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) { setPwMsg({ type: "err", text: "New password must be at least 6 characters." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "Passwords do not match." }); return; }
    try {
      await changePassword(newPw);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg({ type: "ok", text: "Password changed successfully!" });
      setTimeout(() => setPwMsg(null), 3000);
    } catch (err: any) {
      setPwMsg({ type: "err", text: err?.message ?? "Failed to change password." });
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 sm:px-5 py-10 space-y-5">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white animate-fade-up">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <Link to="/delivery" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Delivery Portal
          </Link>
          <div className="relative flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur text-2xl font-extrabold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold mb-1">
                <Truck className="h-3.5 w-3.5" /> Delivery Agent
              </div>
              <h1 className="text-xl font-extrabold">{user.name}</h1>
              <p className="text-sm text-white/70">{user.email}</p>
              <p className="font-mono text-[11px] text-white/50 mt-0.5">ID: {user.id}</p>
            </div>
          </div>
          <p className="relative mt-3 text-xs text-white/60">
            You can update your name, phone number and password. Email and role are managed by admin.
          </p>
        </div>

        {/* ── Profile details form ── */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><UserIcon className="h-4 w-4" /></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Details</h2>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
            <div className={inp}>
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your full name" required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
            <div className={`${inp} opacity-60 cursor-not-allowed`}>
              <span className="text-sm text-muted-foreground flex-1">{user.email}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Email is assigned by admin and cannot be changed.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact Number
            </label>
            <div className={inp}>
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                type="tel" placeholder="+1 (555) 000-0000"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>

          {profileError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{profileError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95">
              <Save className="h-4 w-4" /> Save Changes
            </button>
            {profileSaved && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 animate-fade-in">
                <Check className="h-4 w-4" /> Saved!
              </span>
            )}
          </div>
        </form>

        {/* ── Change password form ── */}
        <form onSubmit={savePassword} className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Lock className="h-4 w-4" /></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Change Password</h2>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Current Password *</label>
            <div className={inp}>
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <input value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                type={showCurrent ? "text" : "password"} placeholder="Enter current password" required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-muted-foreground hover:text-primary transition-colors">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">New Password *</label>
              <div className={inp}>
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  type={showNew ? "text" : "password"} placeholder="Min. 6 chars" required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="text-muted-foreground hover:text-primary transition-colors">
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Confirm *</label>
              <div className={inp}>
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  type={showNew ? "text" : "password"} placeholder="Repeat" required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          {pwMsg && (
            <p className={`rounded-lg px-3 py-2 text-xs font-medium ${pwMsg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-destructive/10 text-destructive"}`}>
              {pwMsg.type === "ok" && <Check className="inline h-3.5 w-3.5 mr-1" />}{pwMsg.text}
            </p>
          )}

          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95">
            <Lock className="h-4 w-4" /> Update Password
          </button>
        </form>

      </div>
    </PageShell>
  );
}

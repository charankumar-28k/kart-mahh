import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag, Package, Star, User as UserIcon, Phone, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSupabaseStore } from "../lib/supabase-store";
import heroCart from "../assets/hero-cart.png";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Tab = "signin" | "signup";

const inp = "mt-1 w-full flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:shadow-[var(--shadow-soft)]";

function LoginPage() {
  const { signIn, signUp, user, loading } = useSupabaseStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("signin");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSubmitting(true);
    try {
      await signIn(signInEmail.trim(), signInPassword);
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setSignInError(err?.message ?? "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    if (!signUpName.trim()) { setSignUpError("Full name is required."); return; }
    if (!signUpEmail.trim()) { setSignUpError("Email is required."); return; }
    if (signUpPassword.length < 6) { setSignUpError("Password must be at least 6 characters."); return; }
    if (signUpPassword !== signUpConfirm) { setSignUpError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await signUp(signUpName.trim(), signUpEmail.trim(), signUpPassword);
      setSignUpSuccess(true);
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (err: any) {
      setSignUpError(err?.message ?? "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setSignInError("");
    setSignUpError("");
    setSignUpSuccess(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-hero)] opacity-80" />
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 [background:var(--gradient-brand)] opacity-25 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[var(--accent-orange)] opacity-20 blur-3xl animate-float-slow" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden lg:flex lg:flex-col lg:justify-center">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 w-fit">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold shadow-[var(--shadow-glow)]">C</span>
            <span className="text-xl font-extrabold">Classi<span className="gradient-text">Ads</span></span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-1.5 text-sm font-bold text-white mb-4 w-fit">
            <ShoppingBag className="h-4 w-4" /> Customer Portal
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {tab === "signin" ? <>Welcome <span className="gradient-text animate-gradient">back</span></> : <>Join <span className="gradient-text animate-gradient">ClassiAds</span></>}
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            {tab === "signin" ? "Sign in to shop, track your orders and manage your account." : "Create a free account and start shopping thousands of local deals."}
          </p>
          <ul className="mt-6 space-y-3">
            {[{ icon: ShoppingBag, text: "Browse & buy products" }, { icon: Package, text: "Track your orders in real time" }, { icon: Star, text: "Save to wishlist & write reviews" }].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-white"><f.icon className="h-4 w-4" /></span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="relative mt-10">
            <img src={heroCart} alt="" className="w-full max-w-md animate-float-slow drop-shadow-2xl" />
          </div>
        </div>

        {/* Right panel */}
        <div className="relative mx-auto w-full max-w-md animate-scale-pop">
          <div className="absolute -inset-1 rounded-3xl [background:var(--gradient-brand)] opacity-30 blur-2xl" />
          <div className="relative rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <Link to="/" className="mb-5 inline-flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold">C</span>
              <span className="text-lg font-extrabold">ClassiAds</span>
            </Link>
            <div className="flex gap-1 rounded-xl bg-secondary p-1 mb-6">
              <button type="button" onClick={() => switchTab("signin")} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "signin" ? "[background:var(--gradient-brand)] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>Sign In</button>
              <button type="button" onClick={() => switchTab("signup")} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "signup" ? "[background:var(--gradient-brand)] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>Create Account</button>
            </div>

            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl [background:var(--gradient-brand)] text-white shrink-0"><UserIcon className="h-5 w-5" /></span>
                  <div>
                    <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>Welcome back</h1>
                    <p className="text-xs text-muted-foreground">Sign in to your account</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email address</label>
                  <div className={inp}>
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} type="email" placeholder="you@example.com" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Password</label>
                  <div className={inp}>
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} type={show ? "text" : "password"} placeholder="••••••••" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                    <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-primary transition-colors">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
                {signInError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{signInError}</p>}
                <button type="submit" disabled={submitting} className="group relative w-full overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100">
                  <span className="flex items-center justify-center gap-2">
                    {submitting ? "Signing in…" : <><span>Sign in</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                  </span>
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}<button type="button" onClick={() => switchTab("signup")} className="font-semibold text-primary hover:underline">Create one →</button>
                </p>
                <div className="pt-2 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">Are you staff?{" "}<Link to="/staff-login" className="font-semibold text-primary hover:underline">Staff Login →</Link></p>
                </div>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl [background:var(--gradient-brand)] text-white shrink-0"><ShoppingBag className="h-5 w-5" /></span>
                  <div>
                    <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>Create account</h1>
                    <p className="text-xs text-muted-foreground">Free forever — start shopping today</p>
                  </div>
                </div>
                {signUpSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-pop">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                    <p className="font-bold text-lg">Account created!</p>
                    <p className="text-sm text-muted-foreground">Redirecting you to the homepage...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Full name <span className="text-destructive">*</span></label>
                      <div className={inp}>
                        <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input value={signUpName} onChange={(e) => setSignUpName(e.target.value)} type="text" placeholder="Jane Doe" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Email address <span className="text-destructive">*</span></label>
                      <div className={inp}>
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} type="email" placeholder="you@example.com" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Mobile number <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <div className={inp}>
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input type="tel" placeholder="+1 (555) 123-4567" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Password <span className="text-destructive">*</span></label>
                      <div className={inp}>
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} type={show ? "text" : "password"} placeholder="Min. 6 characters" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                        <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-primary transition-colors">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Confirm password <span className="text-destructive">*</span></label>
                      <div className={inp}>
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input value={signUpConfirm} onChange={(e) => setSignUpConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="Re-enter password" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground hover:text-primary transition-colors">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    </div>
                    {signUpError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{signUpError}</p>}
                    <button type="submit" disabled={submitting} className="group relative w-full overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100">
                      <span className="flex items-center justify-center gap-2">
                        {submitting ? "Creating…" : <><span>Create Account</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                      </span>
                    </button>
                    <p className="text-center text-xs text-muted-foreground">
                      Already have an account?{" "}<button type="button" onClick={() => switchTab("signin")} className="font-semibold text-primary hover:underline">Sign in →</button>
                    </p>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

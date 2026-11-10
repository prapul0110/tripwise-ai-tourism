import { useEffect, useState } from "react";
import { Lock, Mail, User, X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { closeAuthModal, subscribeAuthModal } from "@/lib/authModal";
import { Button } from "@/components/ui/button";

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    return subscribeAuthModal(open => {
      setIsOpen(open);
      if (open) {
        setEmail("");
        setPassword("");
        setName("");
      }
    });
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      if (mode === "signin") {
        await loginMutation.mutateAsync({ email, password });
        toast.success("Welcome back!");
      } else {
        await registerMutation.mutateAsync({ email, password, name });
        toast.success("Account created successfully!");
      }

      await utils.auth.me.invalidate();
      closeAuthModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      toast.error(message);
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-card border border-teal-500/20 bg-background/90 text-foreground shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={() => closeAuthModal()}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <p className="eyebrow flex items-center gap-1.5 mb-1 text-teal-400">
            <Sparkles size={14} /> TripWise Account
          </p>
          <h2 id="auth-modal-title" className="text-2xl font-serif font-bold text-foreground">
            {mode === "signin" ? (
              <>Sign in to your <em>journey.</em></>
            ) : (
              <>Create your <em>account.</em></>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin"
              ? "Access your saved trips, custom preferences, and AI plans."
              : "Start shaping unhurried, intelligent travel routes across India."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/30 border border-border focus:border-teal-400 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/30 border border-border focus:border-teal-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/30 border border-border focus:border-teal-400 focus:outline-none transition"
              />
            </div>
            {mode === "register" && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Must be at least 8 characters.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full button-teal button-lg mt-2 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Create Account"}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-teal-400 hover:underline font-medium"
              >
                Create one now
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-teal-400 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

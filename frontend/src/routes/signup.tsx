import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signupUser } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { KeyRound, Mail, User, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Create Account — NexLink" }] }),
  component: Signup,
});

function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signupMutation = useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast.success("Account created successfully! Welcome to NexLink.");
      router.navigate({ to: "/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create account. Email may be in use.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    signupMutation.mutate({ name, email, password });
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-mesh bg-grid text-foreground overflow-x-hidden">
      <AmbientBackdrop />
      
      {/* Left Column: Form Card */}
      <div className="relative flex items-center justify-center p-6 lg:p-12 z-10 min-h-screen">
        <div className="absolute top-6 left-6">
          <Logo to="/" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-2xl liquid-glass p-8 relative"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gradient">Create account</h2>
            <p className="text-xs text-muted-foreground mt-1.5">
              Start shortening and tracking links in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Full name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-background/50 border border-border/70 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-background/50 border border-border/70 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-background/50 border border-border/70 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Confirm password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-background/50 border border-border/70 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2.5 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer mt-2"
            >
              {signupMutation.isPending ? "Creating account..." : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-border/60 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-neon hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Visual SaaS & Security Board */}
      <div className="hidden lg:flex relative items-center justify-center p-12 bg-card/10 border-l border-border/40 overflow-hidden">
        <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-primary/20 to-neon/15 blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative max-w-md w-full rounded-2xl liquid-glass p-8 ring-soft space-y-6 z-10"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neon font-semibold bg-neon/10 px-2.5 py-0.5 rounded">Security Verified</span>
            <h3 className="text-xl font-bold tracking-tight text-gradient">NexLink Enterprise Shield</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Every link shortened is protected by edge firewalls, brute-force filters, and end-to-end audit logging.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: "Passcode Protection Gates", desc: "Secure sensitive routes and verify access codes before redirection." },
              { title: "Click Expirations & Limits", desc: "Deactivate links automatically based on custom click caps or calendars." },
              { title: "Bulk CSV Processing", desc: "Upload CSV or TXT lists to create and tag hundreds of links in seconds." },
              { title: "Real-Time Click Analytics", desc: "Track browser agent types, geography, and referring channels instantly." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-normal">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-success/10 text-success">
                  <ArrowRight className="h-3 w-3" />
                </div>
                <div>
                  <strong className="text-foreground block">{item.title}</strong>
                  <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Redirection Latency: <strong>&lt;40ms</strong></span>
            <span>Uptime: <strong>99.99%</strong></span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

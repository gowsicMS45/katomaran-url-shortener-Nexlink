import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { BACKEND_BASE_URL } from "@/lib/backendUrl";

export const Route = createFileRoute("/gate/$shortCode")({
  head: () => ({ meta: [{ title: "Password Protected Link — NexLink" }] }),
  component: GatePage,
});

function GatePage() {
  const { shortCode } = Route.useParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (pass: string) => {
      const res = await fetch(`${BACKEND_BASE_URL}/api/urls/${shortCode}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Incorrect password");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Verification successful! Redirecting...");
      // Redirect to the original URL
      window.location.href = data.originalUrl;
    },
    onError: (err: any) => {
      toast.error(err.message || "Invalid password. Access denied.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    verifyMutation.mutate(password);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-mesh bg-grid">
      <AmbientBackdrop />
      <div className="absolute top-6 left-6">
        <Logo to="/" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl glass p-8 ring-soft bg-background/40 relative z-10"
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-4">
          <Lock className="h-5 w-5" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Password Required</h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            This shortened link is password-protected. Please enter the password to proceed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter link password"
                className="w-full bg-background/50 border border-border/70 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2.5 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {verifyMutation.isPending ? "Verifying..." : "Access Link"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

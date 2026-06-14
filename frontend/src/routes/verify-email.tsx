import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyEmail, resendVerification } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Verify Email — NexLink Console" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      toast.success("Email verified successfully! Opening console...");
      // Invalidate currentUser query to update layout verification status
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.navigate({ to: "/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Invalid or expired verification code.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => {
      toast.success("Verification code resent to your email.");
      toast.info("In development, check the backend console terminal logs to see the code!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to resend code.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    verifyMutation.mutate(code);
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-mesh bg-grid">
      <AmbientBackdrop />
      <div className="absolute top-6 left-6">
        <Logo to="/dashboard" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl liquid-glass p-8 relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gradient">Verify your email</h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            We sent a 6-digit verification code to your email. Enter it below to unlock full console capabilities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">6-Digit Verification Code</label>
            <div className="relative flex items-center">
              <ShieldAlert className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-background/50 border border-border/70 rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2.5 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer magnetic-btn active:magnetic-btn-active"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/60 text-xs">
          <button
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="inline-flex items-center gap-1 text-neon hover:underline font-medium cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${resendMutation.isPending ? "animate-spin" : ""}`} />
            Resend Verification Code
          </button>
          <button
            onClick={() => router.navigate({ to: "/dashboard" })}
            className="text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            Open Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}

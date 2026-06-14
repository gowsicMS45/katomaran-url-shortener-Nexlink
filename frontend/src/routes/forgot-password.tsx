import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword, resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { Mail, KeyRound, ArrowRight, ShieldCheck, Check, X } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Forgot Password — NexLink Console" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success("If an account exists with that email, a password reset code has been sent.");
      toast.info("In development, check the backend console terminal logs to see the generated code!");
      setStep(2);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to request reset code. Please check email address.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password has been successfully reset. Please sign in.");
      router.navigate({ to: "/login" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Invalid or expired reset code.");
    },
  });

  // Password requirements criteria
  const meetsMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isStrong = meetsMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const validateEmail = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError("Email address is required.");
    } else if (!emailRegex.test(val)) {
      setEmailError("Please enter a valid email format (e.g. name@company.com).");
    } else {
      setEmailError("");
    }
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    requestMutation.mutate(email);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    if (!isStrong) {
      toast.error("Please ensure your password meets all strength requirements.");
      return;
    }
    resetMutation.mutate({ email, code, password: newPassword });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-mesh bg-grid">
      <AmbientBackdrop />
      <div className="absolute top-6 left-6">
        <Logo to="/" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl liquid-glass p-8 relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gradient">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            {step === 1
              ? "We'll send you a 6-digit code to recover your account"
              : `Enter the code sent to ${email} to set a new password`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full bg-background/50 border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition focus-liquid ${
                    emailError ? "border-destructive/60 focus:ring-destructive" : "border-border/70 focus:ring-primary"
                  }`}
                />
              </div>
              {emailError && (
                <div className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 mt-1.5">
                  {emailError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={requestMutation.isPending || !!emailError || !email}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2.5 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer magnetic-btn active:magnetic-btn-active"
            >
              {requestMutation.isPending ? "Sending code..." : "Request Reset Code"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">6-Digit Code</label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 h-4 w-4 text-muted-foreground" />
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

            <div>
              <label className="block text-xs text-muted-foreground mb-1">New Password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-background/50 border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition focus-liquid ${
                    newPassword && !isStrong ? "border-warning/60" : "border-border/70"
                  }`}
                />
              </div>

              {/* Password strength criteria list */}
              {newPassword && (
                <div className="mt-3 p-3 rounded-lg border border-border/50 bg-background/30 text-xs space-y-1.5">
                  <div className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Password Strength Checklist</div>
                  
                  <div className="flex items-center gap-1.5">
                    {meetsMinLength ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={meetsMinLength ? "text-success" : "text-muted-foreground"}>At least 8 characters</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasUppercase && hasLowercase ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasUppercase && hasLowercase ? "text-success" : "text-muted-foreground"}>Mixed case letters (A-Z, a-z)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasNumber ? "text-success" : "text-muted-foreground"}>At least one number (0-9)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasSpecial ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasSpecial ? "text-success" : "text-muted-foreground"}>At least one special character</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending || !isStrong || !code}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2.5 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer magnetic-btn active:magnetic-btn-active"
            >
              {resetMutation.isPending ? "Resetting password..." : "Reset Password"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="text-center mt-6 pt-6 border-t border-border/60 text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="text-neon hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
export default ForgotPassword;

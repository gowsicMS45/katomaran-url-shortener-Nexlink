import { useEffect, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";

export function AppShell({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: ReactNode }) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: 1,
    enabled: typeof window !== "undefined" && !!token,
  });

  if (typeof window !== "undefined" && !token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0d14] text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex text-foreground bg-background relative overflow-x-hidden">
      <AmbientBackdrop variant="subtle" />
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <TopBar title={title} subtitle={subtitle} />
        
        {/* Email Verification Banner */}
        {user && user.isVerified === false && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 lg:mx-8 mt-4 rounded-xl liquid-glass border-warning/30 bg-warning/5 p-3 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-warning"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
              <span>
                <strong>Email Verification Required:</strong> Please verify your email address to secure your account.
              </span>
            </div>
            <Link
              to="/verify-email"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning text-xs font-semibold apple-spring select-none"
            >
              Verify Email <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 px-4 lg:px-8 py-6 lg:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

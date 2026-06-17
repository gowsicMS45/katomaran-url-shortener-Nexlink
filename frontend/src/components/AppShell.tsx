import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { motion } from "framer-motion";

export function AppShell({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: ReactNode }) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;

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

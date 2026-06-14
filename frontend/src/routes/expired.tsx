import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { CalendarX, Home } from "lucide-react";

export const Route = createFileRoute("/expired")({
  head: () => ({ meta: [{ title: "Link Expired — NexLink" }] }),
  component: ExpiredPage,
});

function ExpiredPage() {
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
        className="w-full max-w-md rounded-2xl glass p-8 ring-soft text-center bg-background/40 relative z-10"
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center text-destructive mb-4">
          <CalendarX className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">Link Expired</h2>
        <p className="text-sm text-muted-foreground mt-2">
          This shortened link has reached its expiration date and is no longer available.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium hover:bg-accent/60 transition"
          >
            <Home className="h-4 w-4" /> Go back home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

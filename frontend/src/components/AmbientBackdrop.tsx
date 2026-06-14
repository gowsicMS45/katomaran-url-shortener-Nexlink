import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function AmbientBackdrop({ variant = "full" }: { variant?: "full" | "subtle" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configure high-damping spring for extremely smooth cursor following
  const springConfig = { damping: 45, stiffness: 120, mass: 0.8 };
  const xSpring = useSpring(mouseX, springConfig);
  const ySpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMouseMove = (e: MouseEvent) => {
      // Centering the 250px radial gradient on the cursor
      mouseX.set(e.clientX - 125);
      mouseY.set(e.clientY - 125);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Subtle glow pulse overlay */}
      <motion.div
        className="absolute inset-0 bg-primary/5 pointer-events-none"
        animate={{ opacity: [0.08, 0.22, 0.08] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)" }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.06, 0.94, 1],
          opacity: [0.6, 0.8, 0.5, 0.6]
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--neon) 50%, transparent), transparent 70%)" }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.93, 1.07, 1],
          opacity: [0.5, 0.7, 0.45, 0.5]
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      {variant === "full" && (
        <motion.div
          className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--neon-2) 45%, transparent), transparent 70%)" }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.05, 0.95, 1],
            opacity: [0.4, 0.6, 0.35, 0.4]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Mouse reactive cursor spotlight */}
      <motion.div
        className="absolute h-[250px] w-[250px] rounded-full pointer-events-none blur-3xl opacity-25 mix-blend-screen"
        style={{
          x: xSpring,
          y: ySpring,
          background: "radial-gradient(circle, color-mix(in oklab, var(--neon) 50%, transparent), transparent 75%)"
        }}
      />

      {/* Particle dots */}
      <Particles count={28} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0.02 265 / 70%))" }} />
    </div>
  );
}

function Particles({ count }: { count: number }) {
  const items = Array.from({ length: count });
  return (
    <div className="absolute inset-0">
      {items.map((_, i) => {
        const left = (i * 97) % 100;
        const top = (i * 53) % 100;
        const size = 1 + (i % 3);
        const delay = (i % 7) * 0.6;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            animate={{ opacity: [0.1, 0.7, 0.1], y: [0, -20, 0] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

import { Link } from "@tanstack/react-router";

export function Logo({ to = "/", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary via-neon to-neon-2 ring-soft">
        <span className="absolute inset-0 rounded-lg blur-md opacity-60 bg-gradient-to-br from-primary via-neon to-neon-2 group-hover:opacity-90 transition" />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-background" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1 1" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1-1" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight">
        Nex<span className="text-gradient">Link</span>
      </span>
    </Link>
  );
}

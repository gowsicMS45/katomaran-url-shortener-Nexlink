import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Globe2, ShieldCheck, Zap, BarChart3, QrCode,
  Code2, Cpu, Lock, Check, Star, Github, Twitter, Linkedin, Upload, Download
} from "lucide-react";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Logo } from "@/components/Logo";
import { TrafficArea, SourcesPie } from "@/components/charts/Charts";
import { trafficData, sourcesData } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexLink — Premium URL Intelligence Platform" },
      { name: "description", content: "NexLink is the URL intelligence platform for modern teams. Shorten, track and optimize every link with real-time analytics, deep insights, bulk actions and enterprise-grade security." },
      { property: "og:title", content: "NexLink — Premium URL Intelligence Platform" },
      { property: "og:description", content: "Shorten, track and optimize every link with real-time analytics, deep insights, and enterprise security." },
    ],
  }),
  component: Landing,
});

// Premium CountUp element triggered when scrolled into view
function CountUp({ value, duration = 2000 }: { value: string; duration?: number }) {
  const cleanValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const suffix = value.replace(/[0-9.,]/g, '');
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || isNaN(cleanValue)) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      const ease = progressRatio * (2 - progressRatio); // easeOutQuad
      setCount(ease * cleanValue);
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [inView, cleanValue, duration]);

  if (isNaN(cleanValue)) {
    return <span ref={ref}>{value}</span>;
  }

  const formattedCount = count.toFixed(value.includes(".") ? 2 : 0);
  return <span ref={ref}>{parseFloat(formattedCount).toLocaleString()}{suffix}</span>;
}

const handleMouseMoveGlow = (e: React.MouseEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
};

function Landing() {
  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">
      <AmbientBackdrop />
      <Nav />
      <Hero />
      <LogoMarquee />
      <Features />
      <DashboardPreview />
      <Analytics />
      <BulkOperations />
      <Security />
      <Testimonials />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  );
}

function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${
      isScrolled 
        ? "bg-background/80 border-border/80 backdrop-blur-2xl py-3 shadow-lg" 
        : "bg-background/0 border-transparent backdrop-blur-none py-4"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center px-6">
        <Logo />
        <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#analytics" className="hover:text-foreground transition">Analytics</a>
          <a href="#bulk" className="hover:text-foreground transition">Bulk Operations</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#security" className="hover:text-foreground transition">Security</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" className="inline-flex text-sm text-muted-foreground hover:text-foreground px-3 py-2">Sign in</Link>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2 text-sm font-medium text-primary-foreground glow-primary">
            Open Console <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-28">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition cursor-pointer select-none">
          <Sparkles className="h-3.5 w-3.5 text-neon" />
          Introducing Bulk Processing · Import CSVs & export manifests
          <span className="text-neon">→</span>
        </Link>
        <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          The URL <span className="text-gradient">intelligence platform</span><br /> built for modern teams.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Shorten, tag and catalog links at scale. Leverage high-density dashboards,
          branded QR downloads, and edge passcode gate protection in one premium workspace.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-neon px-5 py-3 text-sm font-medium text-primary-foreground glow-primary">
            Launch Console <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#analytics" className="inline-flex items-center gap-2 glass rounded-xl px-5 py-3 text-sm font-medium hover:bg-accent/60 transition">
            See live analytics
          </a>
        </div>
        <div className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success"/> SOC 2 Type II</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success"/> GDPR ready</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success"/> 99.99% SLA</span>
        </div>
      </motion.div>

      {/* Hero device */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative mt-16 mx-auto max-w-6xl"
        style={{ perspective: 1200 }}
      >
        <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-tr from-primary/30 via-neon/20 to-neon-2/30 blur-2xl opacity-60" />
        <div className="rounded-2xl glass p-2 ring-soft overflow-hidden reflection-sweep hover-depth">
          <div className="rounded-xl bg-background/80 border border-border/70 overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-[11px] text-muted-foreground">console.nexlink.io / overview</span>
            </div>
            <div className="grid grid-cols-12 gap-3 p-3">
              <div className="col-span-12 md:col-span-8 rounded-lg bg-card/70 p-4">
                <div className="text-xs text-muted-foreground mb-2">Traffic, last 30 days</div>
                <TrafficArea data={trafficData} />
              </div>
              <div className="col-span-12 md:col-span-4 rounded-lg bg-card/70 p-4">
                <div className="text-xs text-muted-foreground mb-2">Traffic sources</div>
                <SourcesPie data={sourcesData} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function LogoMarquee() {
  const items = ["ACME", "QUANTUM", "NORTHWIND", "HELIX", "AURORA", "LUMEN", "OCTANE", "POLARIS"];
  return (
    <div className="border-y border-border/60 bg-background/40">
      <div className="mx-auto max-w-7xl px-6 py-6 overflow-hidden">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4">Trusted by teams shipping at scale</div>
        <div className="flex items-center justify-center gap-10 flex-wrap opacity-70">
          {items.map((n) => (
            <span key={n} className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    { icon: Zap, title: "Realtime Intelligence", body: "Monitor link clicks immediately with live websocket analytics dashboards." },
    { icon: BarChart3, title: "Deep Analytics", body: "Check browsers, devices, geographic coordinates, and referring channels." },
    { icon: QrCode, title: "Custom QR Codes", body: "Generate customizable branded vectors for flyers, print, or emails instantly." },
    { icon: Globe2, title: "Global Edge", body: "Deliver sub‑40ms link redirection globally from 280+ POP regions." },
    { icon: ShieldCheck, title: "Enterprise Security", body: "SOC 2 compliance, click limits, passcode gates, and link expirations." },
    { icon: Cpu, title: "Bulk link actions", body: "Import link lists via CSV/TXT and download short URL catalogs instantly." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHead eyebrow="Platform" title="Every signal from every link" subtitle="A unified surface for shortening, routing, measuring and optimizing every URL across your org." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            onMouseMove={handleMouseMoveGlow}
            className="group relative rounded-2xl glass p-6 ring-soft hover-depth hover-glow-spotlight transition"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/60 text-neon">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/0 via-transparent to-neon/0 group-hover:from-primary/10 group-hover:to-neon/10 transition" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <SectionHead eyebrow="Console" title="A surface that scales with you" subtitle="From your first link to your hundred millionth — one fast, opinionated console." />
      <div className="rounded-2xl glass p-2 ring-soft reflection-sweep hover-depth">
        <div className="rounded-xl border border-border/70 bg-background/70 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { k: "Total Links", v: "184302" }, { k: "Clicks", v: "12.4M" },
              { k: "Unique Visitors", v: "8.9M" }, { k: "CTR", v: "6.21%" },
            ].map((s) => (
              <div
                key={s.k}
                onMouseMove={handleMouseMoveGlow}
                className="rounded-lg bg-card/70 p-4 hover-glow-spotlight transition duration-300"
              >
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
                <div className="mt-2 text-2xl font-semibold">
                  <CountUp value={s.v} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Analytics() {
  return (
    <section id="analytics" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHead eyebrow="Analytics" title="Beautiful, opinionated insights" subtitle="Pre-built dashboards for every team — marketing, growth, product and developer relations." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          onMouseMove={handleMouseMoveGlow}
          className="rounded-2xl glass p-5 lg:col-span-2 ring-soft hover-depth hover-glow-spotlight"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Traffic</div>
              <div className="text-lg font-semibold">Clicks vs. unique visitors</div>
            </div>
            <span className="text-xs text-success">+18.2% MoM</span>
          </div>
          <TrafficArea data={trafficData} />
        </div>
        <div
          onMouseMove={handleMouseMoveGlow}
          className="rounded-2xl glass p-5 ring-soft hover-depth hover-glow-spotlight"
        >
          <div className="text-xs text-muted-foreground">Traffic sources</div>
          <div className="text-lg font-semibold mb-3">Where clicks come from</div>
          <SourcesPie data={sourcesData} />
        </div>
      </div>
    </section>
  );
}

function BulkOperations() {
  return (
    <section id="bulk" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHead small eyebrow="Operations" title="Bulk link shortening & CSV downloads" subtitle="Shorten and organize hundreds of links simultaneously. Export comprehensive manifests in seconds." />
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Import lists of destination URLs via simple line breaks",
              "CSV & text file upload support with automatic tag parsing",
              "Export complete catalogs with clicks, tags and active status",
              "Dynamic duplicate filtering and client-side URL validation",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-success" /> {t}</li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 glass rounded-lg px-4 py-2 text-sm hover:bg-accent/60 transition cursor-pointer">
              <Upload className="h-4 w-4 text-neon" /> Open Bulk Console
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl glass p-2 ring-soft reflection-sweep hover-depth"
        >
          <div className="rounded-xl bg-background/80 border border-border/70 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-2 bg-muted/40">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-neon" />
                <span className="text-xs font-semibold">Bulk Import Preview</span>
              </div>
              <span className="text-[10px] text-muted-foreground">nx.lk / bulk</span>
            </div>
            
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CSV Source Preview</div>
              <div className="bg-muted/30 border border-border/50 rounded p-2 text-muted-foreground leading-normal whitespace-pre">
                url, tags<br />
                https://acme.com/spring26, promo, spring<br />
                https://acme.com/docs, documentation
              </div>
              
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2 mb-1">Shortened Manifest Results</div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-success/5 border border-success/10 p-1.5 rounded">
                  <span className="truncate text-foreground/80">https://acme.com/spring26</span>
                  <span className="text-neon font-semibold">nx.lk/spring26</span>
                </div>
                <div className="flex justify-between items-center bg-success/5 border border-success/10 p-1.5 rounded">
                  <span className="truncate text-foreground/80">https://acme.com/docs</span>
                  <span className="text-neon font-semibold">nx.lk/xY7a2b</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Security() {
  const items = [
    { icon: Lock, t: "Passcode gates", b: "Protect sensitive routes and content using instant edge password gates." },
    { icon: ShieldCheck, t: "SOC 2 Type II", b: "Independently audited security controls across your link data lifecycle." },
    { icon: Cpu, t: "Click Limiters", b: "Cap link redirects automatically to stay within budgets and quotas." },
  ];
  return (
    <section id="security" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHead eyebrow="Security" title="Enterprise-grade by default" subtitle="Compliance, governance and observability — without slowing teams down." />
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <div
            key={i.t}
            onMouseMove={handleMouseMoveGlow}
            className="rounded-2xl glass p-6 ring-soft hover-depth hover-glow-spotlight"
          >
            <i.icon className="h-5 w-5 text-neon" />
            <div className="mt-3 font-semibold">{i.t}</div>
            <div className="text-sm text-muted-foreground mt-1">{i.b}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "NexLink replaced three internal tools. Our growth team finally has one source of truth.", a: "Priya N.", r: "Head of Growth, Helix" },
    { q: "Bulk importing changed our workflow. We can configure hundreds of campaign links in minutes.", a: "Marco V.", r: "Staff Engineer, Octane" },
    { q: "Analytics depth is amazing. Click counts, referrers, and geo maps help us target users in real time.", a: "Sara L.", r: "VP Marketing, Aurora" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHead eyebrow="Customers" title="Loved by modern teams" />
      <div className="grid gap-4 md:grid-cols-3">
        {t.map((x) => (
          <div key={x.a} className="rounded-2xl glass p-6 ring-soft hover-depth">
            <div className="flex gap-1 text-warning">{Array.from({length:5}).map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-current"/>)}</div>
            <p className="mt-3 text-sm text-foreground/90">"{x.q}"</p>
            <div className="mt-4 text-xs text-muted-foreground">{x.a} · {x.r}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "$0", desc: "For makers and side projects.", feats: ["10k clicks / mo", "Basic analytics", "Community support"] },
    { name: "Pro", price: "$29", desc: "For modern teams.", feats: ["1M clicks / mo", "Advanced analytics", "Branded QR", "Bulk Imports & Exports"], featured: true },
    { name: "Enterprise", price: "Custom", desc: "For organizations at scale.", feats: ["Unlimited clicks", "Enterprise Passcodes", "Advanced Bulk Controls", "24/7 SLA Support"] },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHead eyebrow="Pricing" title="Simple, transparent pricing" subtitle="Start free, scale when you do." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            onMouseMove={handleMouseMoveGlow}
            className={`relative rounded-2xl p-6 ring-soft hover-depth hover-glow-spotlight ${p.featured ? "glass border-primary/40 glow-primary" : "glass"}`}
          >
            {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-primary to-neon px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">MOST POPULAR</span>}
            <div className="text-sm text-muted-foreground">{p.name}</div>
            <div className="mt-2 text-4xl font-semibold">{p.price}<span className="text-sm font-normal text-muted-foreground">{p.price !== "Custom" ? "/mo" : ""}</span></div>
            <div className="text-sm text-muted-foreground mt-1">{p.desc}</div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.feats.map((f) => (<li key={f} className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5"/> {f}</li>))}
            </ul>
            <Link
              to="/signup"
              className={`mt-6 block text-center w-full rounded-lg px-4 py-2.5 text-sm font-medium transition ${p.featured ? "bg-gradient-to-r from-primary to-neon text-primary-foreground" : "glass hover:bg-accent/60"}`}
            >
              {p.featured ? "Start free trial" : "Choose " + p.name}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    { q: "Do you offer a free plan?", a: "Yes — Starter is free forever and includes 10k clicks per month." },
    { q: "How fast are redirects?", a: "Sub-40ms median globally from 280+ edge POPs." },
    { q: "Can I bring my own domain?", a: "Yes. Bring custom domains on Pro and above." },
    { q: "Is NexLink SOC 2 compliant?", a: "We're SOC 2 Type II audited and GDPR-ready." },
  ];
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <SectionHead eyebrow="FAQ" title="Questions, answered" />
      <div className="divide-y divide-border/60 rounded-2xl glass ring-soft">
        {items.map((i) => (
          <details key={i.q} className="group p-5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-medium">
              {i.q}
              <span className="text-muted-foreground group-open:rotate-45 transition">+</span>
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/40">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-8 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">The URL intelligence platform for modern teams.</p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <a href="#" aria-label="GitHub" className="hover:text-foreground"><Github className="h-4 w-4"/></a>
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4"/></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-4 w-4"/></a>
          </div>
        </div>
        {[
          { h: "Product", l: ["Features", "Analytics", "QR", "Pricing"] },
          { h: "Operations", l: ["Bulk Import", "CSV Export", "Analytics"] },
          { h: "Company", l: ["About", "Security", "Customers", "Contact"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.h}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {c.l.map((x) => <li key={x}><a href="#" className="hover:text-foreground text-muted-foreground transition">{x}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 px-6 py-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        <span>© {new Date().getFullYear()} NexLink, Inc. All rights reserved.</span>
        <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success breathing-pulse"/> All systems normal</span>
      </div>
    </footer>
  );
}

function SectionHead({ eyebrow, title, subtitle, small }: { eyebrow: string; title: string; subtitle?: string; small?: boolean }) {
  return (
    <div className={`mb-10 ${small ? "" : "text-center"}`}>
      <div className="text-xs uppercase tracking-widest text-neon">{eyebrow}</div>
      <h2 className={`mt-2 font-semibold tracking-tight ${small ? "text-3xl" : "text-4xl md:text-5xl"}`}>{title}</h2>
      {subtitle && <p className={`mt-3 text-muted-foreground ${small ? "" : "max-w-2xl mx-auto"}`}>{subtitle}</p>}
    </div>
  );
}
export default Landing;

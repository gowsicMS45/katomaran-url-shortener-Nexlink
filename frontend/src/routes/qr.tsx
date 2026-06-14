import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Download, Share2, Printer, Palette, QrCode as QrIcon, Check, Copy, History } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createUrl, getUrls, UrlItem } from "@/lib/api";
import { toast } from "sonner";
import QRCode from "qrcode";
import { z } from "zod";

export const Route = createFileRoute("/qr")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  validateSearch: z.object({
    url: z.string().optional(),
    code: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "QR Codes — NexLink Console" }] }),
  component: QRPage,
});

function QRPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  const [destinationUrl, setDestinationUrl] = useState(search.url || "https://acme.com/launch-2024");
  const [shortCode, setShortCode] = useState(search.code || "");
  const [fgColor, setFgColor] = useState("#0f172a");
  const [qrStyle, setQrStyle] = useState("Squares");
  const [qrDataUrl, setQrDataUrl] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state if search params change
  useEffect(() => {
    if (search.url) setDestinationUrl(search.url);
    if (search.code) setShortCode(search.code);
  }, [search.url, search.code]);

  // Compute final QR target link.
  // Use window.location.hostname so QR codes work when scanned from a phone
  // on the same network (e.g. frontend opened via 10.x.x.x:8080 → QR points
  // to 10.x.x.x:5000/r/... instead of localhost:5000 which phones can't reach).
  const backendHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const qrTargetLink = shortCode 
    ? `http://${backendHost}:5000/r/${shortCode}?ref=qr` 
    : `${destinationUrl}?ref=qr`;

  // Query saved QR codes (any link with tag 'qr')
  const { data: qrHistory = [], refetch: refetchHistory } = useQuery<UrlItem[]>({
    queryKey: ["urls", { filter: "all" }],
    queryFn: () => getUrls(),
  });

  // Filter local items containing 'qr' tag
  const qrLinks = qrHistory.filter(u => u.tags?.includes("qr"));

  // Create Mutation
  const shortenMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: (data) => {
      setShortCode(data.url.shortCode);
      toast.success("Short link created! QR Code now tracks clicks.");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      refetchHistory();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create short link for tracking.");
    }
  });

  // Render QR Canvas
  useEffect(() => {
    if (!qrTargetLink) return;

    const canvas = canvasRef.current;
    if (canvas) {
      QRCode.toCanvas(
        canvas,
        qrTargetLink,
        {
          width: 280,
          margin: 2,
          color: {
            dark: fgColor,
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }

    QRCode.toDataURL(
      qrTargetLink,
      {
        width: 1024,
        margin: 2,
        color: {
          dark: fgColor,
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [qrTargetLink, fgColor, qrStyle]);

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) {
      toast.error("Please enter a valid destination URL");
      return;
    }
    shortenMutation.mutate({
      originalUrl: destinationUrl,
      tags: ["qr"],
    });
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `nexlink-qr-${shortCode || "code"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloaded QR Code as PNG");
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(qrTargetLink, {
        type: "svg",
        margin: 2,
        color: {
          dark: fgColor,
          light: "#ffffff",
        },
      });
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `nexlink-qr-${shortCode || "code"}.svg`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      toast.success("Downloaded QR Code as SVG");
    } catch (err) {
      toast.error("Failed to generate SVG");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && qrDataUrl) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - NexLink</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              img { width: 300px; height: 300px; }
              p { margin-top: 20px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <img src="${qrDataUrl}" />
            <p>${shortCode ? `nx.lk/${shortCode}` : destinationUrl}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShare = () => {
    const shareText = shortCode ? `nx.lk/${shortCode}` : destinationUrl;
    if (navigator.share) {
      navigator.share({
        title: "NexLink QR Code",
        text: `Check out this link: ${shareText}`,
        url: qrTargetLink,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(qrTargetLink);
      toast.success("Link copied to clipboard");
    }
  };

  const handleQrClick = () => {
    window.open(qrTargetLink, "_blank");
    toast.success("Simulating QR Code scan/click... Visit registered!");
  };

  const loadHistoryItem = (item: UrlItem) => {
    setDestinationUrl(item.originalUrl);
    setShortCode(item.shortCode);
    toast.success(`Loaded QR code: nx.lk/${item.shortCode}`);
  };

  return (
    <AppShell title="QR Codes" subtitle="Generate branded QR codes for any link">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl glass p-8 ring-soft grid place-items-center">
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-primary/30 to-neon/20 blur-2xl" />
            <div
              className="relative h-72 w-72 rounded-2xl bg-white p-4 ring-soft flex flex-col items-center justify-center cursor-pointer shadow-lg hover:scale-[1.02] transition-transform duration-200"
              onClick={handleQrClick}
              title="Click QR code to simulate a scan and register a click event"
            >
              <canvas ref={canvasRef} className="h-full w-full" />
              {shortCode && (
                <div className="absolute bottom-1 bg-white/95 px-2 py-0.5 rounded text-[10px] font-mono text-[#0f172a] shadow-sm font-semibold">
                  nx.lk/{shortCode}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl glass p-5 ring-soft space-y-4">
          <form onSubmit={handleShorten} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Destination URL</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value);
                  setShortCode("");
                }}
                className="mt-1 w-full rounded-lg bg-input/40 border border-border/70 px-3 py-2 text-sm font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={shortenMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-3.5 py-2 text-sm font-medium text-primary-foreground glow-primary transition duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <QrIcon className="h-4 w-4" />
              {shortenMutation.isPending ? "Creating Link..." : shortCode ? "Tracking Active" : "Shorten & Enable Tracking"}
            </button>
          </form>

          <div>
            <label className="text-xs text-muted-foreground">Foreground Color</label>
            <div className="mt-1 flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2">
                {[
                  { name: "Slate", value: "#0f172a" },
                  { name: "Purple", value: "#7c3aed" },
                  { name: "Cyan", value: "#06b6d4" },
                  { name: "Green", value: "#10b981" },
                  { name: "Amber", value: "#f59e0b" }
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFgColor(c.value)}
                    className={`h-6 w-6 rounded-full ring-2 transition-all ${
                      fgColor === c.value ? "ring-primary scale-110" : "ring-transparent hover:scale-105"
                    }`}
                    style={{ background: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Style</label>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
              {["Squares", "Dots", "Rounded"].map((s) => (
                <button
                  key={s}
                  onClick={() => setQrStyle(s)}
                  className={`rounded-lg py-2 transition-colors ${
                    qrStyle === s ? "bg-accent text-foreground border border-border" : "glass hover:bg-accent/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleDownloadPNG}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-3.5 py-2 text-sm font-medium text-primary-foreground glow-primary hover:opacity-90 cursor-pointer"
            >
              <Download className="h-4 w-4" /> PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              className="inline-flex items-center gap-2 rounded-lg glass px-3.5 py-2 text-sm hover:bg-accent/60 cursor-pointer"
            >
              <Download className="h-4 w-4" /> SVG
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg glass px-3.5 py-2 text-sm hover:bg-accent/60 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg glass px-3.5 py-2 text-sm hover:bg-accent/60 cursor-pointer"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* QR Code History Section */}
      <div className="mt-6 rounded-xl glass p-5 ring-soft">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <History className="h-4 w-4 text-neon" /> QR Code History
        </h3>
        {qrLinks.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No QR codes saved yet. Create a shortened QR code using the form above.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qrLinks.map((item) => (
              <div 
                key={item._id}
                onClick={() => loadHistoryItem(item)}
                className="rounded-lg bg-accent/30 border border-border/50 p-4 hover:border-primary/40 transition hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-neon font-semibold">nx.lk/{item.shortCode}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono mt-1">{item.originalUrl}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Clicks: <strong className="text-foreground">{item.clickCount}</strong></span>
                  <span className="underline hover:text-foreground">Load QR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { getUrls, UrlItem } from "@/lib/api";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator
} from "@/components/ui/command";
import { Link2, Bookmark, Tag, Star, Copy, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/lib/backendUrl";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Queries
  const { data: urls = [], isFetching: isUrlsFetching } = useQuery<UrlItem[]>({
    queryKey: ["urls"],
    queryFn: () => getUrls(),
    enabled: open,
  });

  const isSearching = isUrlsFetching;

  // Listen for keyboard shortcuts (⌘K or Ctrl+K) and TopBar clicks
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    const handleOpenSearch = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-global-search", handleOpenSearch);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-global-search", handleOpenSearch);
    };
  }, []);

  // Collect all unique tags
  const tagsSet = new Set<string>();
  urls.forEach((u) => u.tags?.forEach((t) => tagsSet.add(t)));
  const uniqueTags = Array.from(tagsSet);

  // Filter bookmarked/favorite URLs
  const bookmarkedUrls = urls.filter((u) => u.isFavorite);

  // Filter URLs configured with QR tracking
  const qrCodes = urls.filter((u) => u.tags?.some((t) => t.toLowerCase() === "qr"));

  const handleSelectLink = (slug: string) => {
    setOpen(false);
    router.navigate({ to: "/links", search: { q: slug } });
  };



  const handleSelectTag = (tag: string) => {
    setOpen(false);
    router.navigate({ to: "/links", search: { q: tag } });
  };

  const copyLink = (e: React.MouseEvent, shortCode: string) => {
    e.stopPropagation();
    const text = `${BACKEND_BASE_URL}/r/${shortCode}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          toast.success("Link copied to clipboard");
        } else {
          toast.error("Failed to copy link");
        }
      }
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard");
    }
  };

  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div 
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden group w-full h-full"
      >
        {/* Spotlight-style cursor follow radial glow */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, color-mix(in oklab, var(--neon) 8%, transparent), transparent 85%)`,
            zIndex: 0
          }}
        />
        <div className="relative z-10 border-b border-border/40">
          <CommandInput placeholder="Type to search links, tags, bookmarks..." />
          {isSearching && (
            <div className="absolute right-4 top-3.5 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="relative z-10">
          <CommandList className="scrollbar-thin">
            <CommandEmpty>No results found.</CommandEmpty>

        {/* Short links */}
        {urls.length > 0 && (
          <CommandGroup heading="Short Links">
            {urls.slice(0, 5).map((l) => (
              <CommandItem
                key={l._id}
                value={`${l.shortCode} ${l.originalUrl} link`}
                onSelect={() => handleSelectLink(l.shortCode)}
                className="cursor-pointer hover:bg-accent flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-neon" />
                  <span className="font-mono text-neon font-semibold">nx.lk/{l.shortCode}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {l.originalUrl}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => copyLink(e, l.shortCode)}
                    className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Copy short link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* QR Codes */}
        {qrCodes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="QR Codes">
              {qrCodes.slice(0, 5).map((q) => (
                <CommandItem
                  key={q._id}
                  value={`${q.shortCode} ${q.originalUrl} qr code`}
                  onSelect={() => {
                    setOpen(false);
                    router.navigate({ to: "/qr" });
                  }}
                  className="cursor-pointer hover:bg-accent flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4 text-neon-2" />
                  <span className="font-mono text-neon-2 font-semibold">nx.lk/{q.shortCode}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {q.originalUrl}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}





        {/* Bookmarks */}
        {bookmarkedUrls.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bookmarks">
              {bookmarkedUrls.slice(0, 5).map((b) => (
                <CommandItem
                  key={b._id}
                  value={`${b.shortCode} ${b.originalUrl} starred bookmark`}
                  onSelect={() => handleSelectLink(b.shortCode)}
                  className="cursor-pointer hover:bg-accent flex items-center gap-2"
                >
                  <Star className="h-4 w-4 text-warning fill-current" />
                  <span className="font-mono text-warning font-semibold">nx.lk/{b.shortCode}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {b.originalUrl}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Tags */}
        {uniqueTags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {uniqueTags.slice(0, 8).map((t) => (
                <CommandItem
                  key={t}
                  value={`${t} tag`}
                  onSelect={() => handleSelectTag(t)}
                  className="cursor-pointer hover:bg-accent flex items-center gap-2"
                >
                  <Tag className="h-4 w-4 text-success" />
                  <span className="text-sm">{t}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      </div>
      </div>
    </CommandDialog>
  );
}

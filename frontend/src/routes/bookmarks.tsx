import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Bookmark, Star, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUrls, toggleFavorite, UrlItem } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bookmarks")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Bookmarks — NexLink Console" }] }),
  component: Bookmarks,
});

function Bookmarks() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data: favorites = [], isLoading } = useQuery<UrlItem[]>({
    queryKey: ["urls", { filter: "favorites", q }],
    queryFn: () => getUrls({ filter: "favorites", q }),
  });

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (data) => {
      toast.success(data.isFavorite ? "Bookmarked" : "Removed bookmark");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
    },
  });

  return (
    <AppShell title="Bookmarks" subtitle="Pinned links you reference often">
      <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 mb-6 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          placeholder="Search bookmarks..."
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((l) => {
            const _host = typeof window !== "undefined" ? window.location.hostname : "localhost";
            const shortUrl = `http://${_host}:5000/r/${l.shortCode}`;
            return (
              <div
                key={l._id}
                className="block rounded-xl glass p-5 ring-soft hover:border-primary/40 transition hover:scale-[1.01] relative group"
              >
                <div className="flex items-center justify-between">
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-neon font-semibold hover:underline">
                    nx.lk/{l.shortCode}
                  </a>
                  <button
                    onClick={() => favoriteMutation.mutate(l._id)}
                    className="p-1 rounded text-warning hover:opacity-80 transition cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <Star className="h-4 w-4 fill-current text-warning" />
                  </button>
                </div>
                <div className="mt-2 text-sm text-muted-foreground truncate font-mono text-xs">{l.originalUrl}</div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="flex gap-1">
                    {l.tags.slice(0, 2).map(t => (
                      <span key={t} className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px]">{t}</span>
                    ))}
                    {l.tags.length === 0 && <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px]">No Tags</span>}
                  </div>
                  <span className="text-muted-foreground font-semibold">{l.clickCount.toLocaleString()} clicks</span>
                </div>
              </div>
            );
          })}
          {favorites.length === 0 && (
            <div className="col-span-full rounded-xl border border-border/50 bg-accent/10 p-10 text-center text-sm text-muted-foreground">
              {q ? "No matching bookmarks found." : "You haven't bookmarked any links yet. Star links in the Links panel to see them here!"}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

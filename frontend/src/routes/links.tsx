import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUrls, createUrl, updateUrl, deleteUrl, toggleFavorite, UrlItem, bulkCreateUrls } from "@/lib/api";
import { toast } from "sonner";
import { Copy, MoreHorizontal, Plus, Search, Star, QrCode, Trash2, Edit, X, Calendar, Lock, CheckCircle, Archive, FolderOpen, Upload, Download, FileSpreadsheet, AlertCircle, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_BASE_URL } from "@/lib/backendUrl";

export const Route = createFileRoute("/links")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Links — NexLink Console" }] }),
  component: LinksPage,
});

function LinksPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrlData, setNewUrlData] = useState({
    originalUrl: "",
    customAlias: "",
    expiresAt: "",
    clickLimit: "",
    password: "",
    tags: ""
  });

  // Bulk Import State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ originalUrl: string; tags: string[] }[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "success" | "error">("idle");
  const [bulkResultsData, setBulkResultsData] = useState<any[]>([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<UrlItem | null>(null);
  const [editUrlData, setEditUrlData] = useState({
    originalUrl: "",
    expiresAt: "",
    clickLimit: "",
    password: "",
    tags: "",
    isPublicStats: true
  });

  // Inline delete confirmation state (stores the ID awaiting confirmation)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch URLs from backend
  const { data: urls = [], isLoading } = useQuery<UrlItem[]>({
    queryKey: ["urls", { q, sort, filter }],
    queryFn: () => getUrls({ q, sort, filter }),
    refetchInterval: 12000
  });

  // Mutation: Create Link
  const createMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: () => {
      toast.success("Link shortened successfully!");
      setIsCreateOpen(false);
      setNewUrlData({ originalUrl: "", customAlias: "", expiresAt: "", clickLimit: "", password: "", tags: "" });
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create short link");
    }
  });

  // Mutation: Edit Link
  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateUrl(id, payload),
    onSuccess: () => {
      toast.success("Link updated successfully!");
      setIsEditOpen(false);
      setEditingUrl(null);
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update link");
    }
  });

  // Mutation: Delete Link
  const deleteMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      toast.success("Link deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete link");
    }
  });

  // Mutation: Toggle Favorite
  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (data) => {
      toast.success(data.isFavorite ? "Added to bookmarks" : "Removed from bookmarks");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
    }
  });

  // Mutation: Bulk Create Links
  const bulkMutation = useMutation({
    mutationFn: bulkCreateUrls,
    onSuccess: (data) => {
      toast.success("Bulk import complete!");
      setBulkResultsData(data.results || []);
      setBulkStatus("success");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process bulk import.");
      setBulkStatus("error");
    }
  });

  const router = useRouter();



  // Bulk input parser
  const handleBulkInputChange = (text: string) => {
    setBulkInput(text);
    const lines = text.split("\n");
    const parsed: { originalUrl: string; tags: string[] }[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("url,") || lower.startsWith("destination,") || lower.startsWith("originalurl,")) {
        return; // Skip CSV header
      }
      
      const parts = trimmed.split(",");
      const rawUrl = parts[0].trim();
      if (rawUrl) {
        const tags = parts.slice(1).map(t => t.trim()).filter(Boolean);
        parsed.push({ originalUrl: rawUrl, tags });
      }
    });
    setBulkPreview(parsed);
  };

  // CSV drag & drop upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleBulkInputChange(content);
        toast.success(`Imported data from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPreview.length === 0) return;
    setBulkStatus("idle");
    bulkMutation.mutate(bulkPreview);
  };

  // Mutation: Archive / Restore URL
  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) => updateUrl(id, { isArchived }),
    onSuccess: (data) => {
      toast.success(data.url.isArchived ? "Link archived" : "Link restored");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update archive status");
    }
  });

  const handleGoToQr = (originalUrl: string, shortCode: string) => {
    router.navigate({ to: "/qr", search: { url: originalUrl, code: shortCode } as any });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlData.originalUrl) return;

    createMutation.mutate({
      originalUrl: newUrlData.originalUrl,
      customAlias: newUrlData.customAlias || undefined,
      expiresAt: newUrlData.expiresAt ? newUrlData.expiresAt : null,
      clickLimit: newUrlData.clickLimit ? Number(newUrlData.clickLimit) : null,
      password: newUrlData.password || null,
      tags: newUrlData.tags ? newUrlData.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUrl) return;

    editMutation.mutate({
      id: editingUrl._id,
      payload: {
        originalUrl: editUrlData.originalUrl,
        expiresAt: editUrlData.expiresAt ? editUrlData.expiresAt : null,
        clickLimit: editUrlData.clickLimit ? Number(editUrlData.clickLimit) : null,
        password: editUrlData.password || null,
        tags: editUrlData.tags ? editUrlData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        isPublicStats: editUrlData.isPublicStats
      }
    });
  };

  const openEditModal = (url: UrlItem) => {
    setEditingUrl(url);
    setEditUrlData({
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt ? new Date(url.expiresAt).toISOString().split("T")[0] : "",
      clickLimit: url.clickLimit ? String(url.clickLimit) : "",
      password: "", // Hide hashed password
      tags: url.tags ? url.tags.join(", ") : "",
      isPublicStats: url.isPublicStats
    });
    setIsEditOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard");
        return;
      } catch (_clipErr) {
        // Clipboard API failed (e.g. no permission), fall through to execCommand
      }
    }
    // Fallback: execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (success) {
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Could not copy — please copy manually");
      }
    } catch (err) {
      toast.error("Could not copy — please copy manually");
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    try {
      toast.success("CSV download started!");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download CSV");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
    }
  };


  return (
    <AppShell title="Links" subtitle="Manage every short link in your workspace">
      
      {/* Search and Filter Panel */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[280px] flex items-center gap-2 glass rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
            placeholder="Search by shortcode, tag, or destination..."
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 rounded-lg glass p-1">
          {["all", "active", "expired", "favorites", "archived"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md capitalize font-medium transition ${
                filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="glass text-xs rounded-lg px-3 py-2 outline-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="clicks">Most Clicks</option>
        </select>

        <div className="flex flex-wrap gap-2 md:ml-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (urls.length === 0) {
                toast.error("No links available to export.");
                return;
              }
              const filename = filter === 'favorites' ? 'bookmarks.csv' : q.includes('qr') ? 'qr-export.csv' : 'links.csv';
              const exportUrl = `${BACKEND_BASE_URL}/api/urls/export?filter=${filter}&q=${encodeURIComponent(q)}&filename=${filename}`;
              downloadFile(exportUrl, filename);
            }}
            className="rounded-lg glass px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition apple-spring cursor-pointer"
            title="Download links as CSV"
          >
            <Download className="h-3.5 w-3.5 text-neon" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="rounded-lg glass px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition apple-spring cursor-pointer"
            title="Shorten multiple links"
          >
            <Upload className="h-3.5 w-3.5 text-neon" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1.5 glow-primary transition hover:opacity-90 cursor-pointer magnetic-btn active:magnetic-btn-active"
          >
            <Plus className="h-4 w-4" />
            <span>Create link</span>
          </button>
        </div>
      </div>

      {/* Links List Table */}
      <div className="overflow-hidden rounded-xl glass ring-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium w-8"></th>
              <th className="px-4 py-3 text-left font-medium">Short URL</th>
              <th className="px-4 py-3 text-left font-medium">Destination</th>
              <th className="px-4 py-3 text-left font-medium">Tags</th>
              <th className="px-4 py-3 text-right font-medium">Clicks</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {urls.map((l) => {
              const shortUrl = `${BACKEND_BASE_URL}/r/${l.shortCode}`;
              const isExpired = l.expiresAt && new Date(l.expiresAt) <= new Date();
              const isOverLimit = l.clickLimit !== null && l.clickCount >= l.clickLimit;
              const active = !isExpired && !isOverLimit;

              return (
                <tr key={l._id} className="border-t border-border/60 hover:bg-accent/30 transition">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => favoriteMutation.mutate(l._id)}
                      className={`hover:text-warning transition ${l.isFavorite ? "text-warning" : "text-muted-foreground"}`}
                    >
                      <Star className={`h-4 w-4 ${l.isFavorite ? "fill-current" : ""}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon hover:underline hover:opacity-85"
                        title="Open short link"
                      >
                        {l.shortCode}
                      </a>
                      <button
                        onClick={() => copyToClipboard(shortUrl)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Copy short link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[240px] font-mono text-xs" title={l.originalUrl}>
                    <a
                      href={l.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground hover:underline"
                    >
                      {l.originalUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {l.tags.map(t => (
                        <span key={t} className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-semibold">
                          {t}
                        </span>
                      ))}
                      {l.tags.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                        active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-destructive"}`} />
                      {active ? "active" : isExpired ? "expired" : "limit hit"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => router.navigate({ to: "/analytics" })}
                        className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                        title="View Analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const filename = "analytics-report.csv";
                          const exportUrl = `${BACKEND_BASE_URL}/api/analytics/url/${l._id}/export?format=csv&filename=${filename}`;
                          downloadFile(exportUrl, filename);
                        }}
                        className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                        title="Export clicks to CSV"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-neon" />
                      </button>
                      <button
                        onClick={() => handleGoToQr(l.originalUrl, l.shortCode)}
                        className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                        title="Generate QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(l)}
                        className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                        title="Edit link"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {l.isArchived ? (
                        <button
                          onClick={() => archiveMutation.mutate({ id: l._id, isArchived: false })}
                          className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                          title="Restore link"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => archiveMutation.mutate({ id: l._id, isArchived: true })}
                          className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground"
                          title="Archive link"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      {confirmDeleteId === l._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              deleteMutation.mutate(l._id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive text-white hover:bg-destructive/80 transition"
                            title="Confirm delete"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-muted-foreground hover:text-foreground transition"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(l._id)}
                          className="p-1 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                          title="Delete link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {urls.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isLoading ? "Loading your URLs..." : "No shortened links matching current filters found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE URL MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl glass p-6 ring-soft bg-background/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Shorten a new URL</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Destination URL *</label>
                  <input
                    type="url"
                    placeholder="https://example.com/deep/page"
                    value={newUrlData.originalUrl}
                    onChange={(e) => setNewUrlData({ ...newUrlData, originalUrl: e.target.value })}
                    className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Custom Alias (Optional)</label>
                    <input
                      type="text"
                      placeholder="spring26"
                      value={newUrlData.customAlias}
                      onChange={(e) => setNewUrlData({ ...newUrlData, customAlias: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Click Limit (Optional)</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={newUrlData.clickLimit}
                      onChange={(e) => setNewUrlData({ ...newUrlData, clickLimit: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Expiration Date (Optional)</label>
                    <input
                      type="date"
                      value={newUrlData.expiresAt}
                      onChange={(e) => setNewUrlData({ ...newUrlData, expiresAt: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Password Gate (Optional)</label>
                    <input
                      type="password"
                      placeholder="Password"
                      value={newUrlData.password}
                      onChange={(e) => setNewUrlData({ ...newUrlData, password: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="marketing, campaign, q4"
                    value={newUrlData.tags}
                    onChange={(e) => setNewUrlData({ ...newUrlData, tags: e.target.value })}
                    className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full mt-2 rounded-lg bg-gradient-to-r from-primary to-neon py-2.5 text-sm font-semibold text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Generating..." : "Generate Short Link"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT URL MODAL */}
      <AnimatePresence>
        {isEditOpen && editingUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl glass p-6 ring-soft bg-background/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Edit link: nx.lk/{editingUrl.shortCode}</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Destination URL</label>
                  <input
                    type="url"
                    value={editUrlData.originalUrl}
                    onChange={(e) => setEditUrlData({ ...editUrlData, originalUrl: e.target.value })}
                    className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Click Limit (Optional)</label>
                    <input
                      type="number"
                      placeholder="None"
                      value={editUrlData.clickLimit}
                      onChange={(e) => setEditUrlData({ ...editUrlData, clickLimit: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Expiration Date (Optional)</label>
                    <input
                      type="date"
                      value={editUrlData.expiresAt}
                      onChange={(e) => setEditUrlData({ ...editUrlData, expiresAt: e.target.value })}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Password Gate (leave blank to keep current / remove)</label>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={editUrlData.password}
                    onChange={(e) => setEditUrlData({ ...editUrlData, password: e.target.value })}
                    className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editUrlData.tags}
                    onChange={(e) => setEditUrlData({ ...editUrlData, tags: e.target.value })}
                    className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isPublicStats"
                    checked={editUrlData.isPublicStats}
                    onChange={(e) => setEditUrlData({ ...editUrlData, isPublicStats: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary bg-background/50 h-4 w-4"
                  />
                  <label htmlFor="isPublicStats" className="text-xs text-muted-foreground select-none">
                    Make click stats publicly visible to everyone
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="w-full mt-2 rounded-lg bg-gradient-to-r from-primary to-neon py-2.5 text-sm font-semibold text-primary-foreground glow-primary transition hover:opacity-90"
                >
                  {editMutation.isPending ? "Saving changes..." : "Save Changes"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK IMPORT MODAL */}
      <AnimatePresence>
        {isBulkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl glass p-6 ring-soft bg-background/80"
            >
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-neon" />
                  <h3 className="text-sm font-semibold">Bulk Import Links</h3>
                </div>
                <button
                  onClick={() => {
                    setIsBulkOpen(false);
                    setBulkStatus("idle");
                    setBulkInput("");
                    setBulkPreview([]);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {bulkStatus === "success" ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg border border-success/30 bg-success/5 text-xs text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success animate-pulse" />
                    <span>Import complete! Successfully shortened <strong>{bulkResultsData.filter(r => r.success).length}</strong> links.</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-border/50 rounded-lg p-2 bg-background/40 scrollbar-thin">
                    {bulkResultsData.map((res, index) => (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg border text-xs leading-normal flex items-start justify-between gap-3 ${
                          res.success ? "border-success/20 bg-success/5 text-foreground" : "border-destructive/20 bg-destructive/5 text-destructive"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block truncate text-[11px] text-muted-foreground">{res.originalUrl}</span>
                          {res.success ? (
                            <span className="font-mono text-neon text-[11px]">{`${BACKEND_BASE_URL}/r/${res.url?.shortCode}`}</span>
                          ) : (
                            <span className="text-[11px] block text-destructive/80">{res.error}</span>
                          )}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded shrink-0 ${
                          res.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          {res.success ? "Success" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsBulkOpen(false);
                      setBulkStatus("idle");
                      setBulkInput("");
                      setBulkPreview([]);
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-primary to-neon py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 cursor-pointer"
                  >
                    Back to Links
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs text-muted-foreground">Paste Destination URLs (one per line)</label>
                      <label className="text-[10px] text-neon hover:underline cursor-pointer flex items-center gap-1">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Upload CSV / TXT</span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      placeholder={`https://example.com/promo1, tagA, tagB\nhttps://example.com/promo2`}
                      value={bulkInput}
                      onChange={(e) => handleBulkInputChange(e.target.value)}
                      rows={5}
                      className="w-full bg-background/50 border border-border/70 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition scrollbar-thin"
                    />
                  </div>

                  {bulkPreview.length > 0 && (
                    <div className="p-3.5 rounded-lg border border-neon/30 bg-neon/5 text-xs text-foreground space-y-1.5">
                      <div className="font-semibold text-neon">Import Preview</div>
                      <div className="text-[11px] text-muted-foreground leading-normal">
                        Parsed <strong>{bulkPreview.length}</strong> links ready to shorten.
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin border-t border-neon/20 pt-1.5">
                        {bulkPreview.map((p, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] truncate text-muted-foreground">
                            <span className="truncate flex-1 pr-3">{p.originalUrl}</span>
                            <span className="shrink-0 text-[9px] bg-accent/40 px-1 rounded">{p.tags.join(",") || "no tags"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bulkMutation.isPending || bulkPreview.length === 0}
                    className="w-full mt-2 rounded-lg bg-gradient-to-r from-primary to-neon py-2.5 text-xs font-semibold text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {bulkMutation.isPending ? "Shortening links..." : `Import & Shorten ${bulkPreview.length} Links`}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateSettings, UserProfile } from "@/lib/api";
import { toast } from "sonner";
import { User, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Settings — NexLink Console" }] }),
  component: Settings,
});

function Settings() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, error } = useQuery<UserProfile>({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: 1,
  });

  const saveMutation = useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings.");
    },
    mutationFn: updateSettings,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword("");
      setWorkspaceName(user.preferences?.workspaceName || "Acme Inc.");
    }
  }, [user]);

  if (isLoading) {
    return (
      <AppShell title="Settings" subtitle="Loading your console configuration...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Settings" subtitle="Unable to load configuration">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-center text-sm text-destructive">
          Error loading profile settings: {error?.message || "Unknown error"}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
            className="mt-3 block mx-auto rounded-lg bg-destructive px-4 py-2 text-white hover:bg-destructive/80 transition"
          >
            Retry Loading
          </button>
        </div>
      </AppShell>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name, email };
    if (password.trim()) {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      payload.password = password;
    }
    saveMutation.mutate(payload);
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error("Workspace name cannot be empty.");
      return;
    }
    saveMutation.mutate({
      preferences: {
        workspaceName,
      },
    });
  };

  return (
    <AppShell title="Settings" subtitle="Configure profile and workspace settings">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-xl liquid-glass p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
              <User className="h-5 w-5 text-neon" />
              <div className="text-sm font-semibold">Profile Configuration</div>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/40 border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/40 border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/40 border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary transition disabled:opacity-50 cursor-pointer magnetic-btn active:magnetic-btn-active"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Workspace Card */}
        <div className="rounded-xl liquid-glass p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
              <SettingsIcon className="h-5 w-5 text-neon" />
              <div className="text-sm font-semibold">Workspace Settings</div>
            </div>
            <form onSubmit={handleSaveWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-background/40 border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/60 transition focus-liquid"
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-neon px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary transition disabled:opacity-50 cursor-pointer magnetic-btn active:magnetic-btn-active"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
export default Settings;

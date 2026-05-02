import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { browserNotify, ensureNotificationPermission } from "@/lib/notify";

type Notif = { id: string; title: string; body: string | null; read: boolean; created_at: string; application_id: string | null };

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!user) return;
    ensureNotificationPermission();
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data as Notif[]) || []));

    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev]);
          browserNotify(n.title, n.body || undefined);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  };

  if (!user) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="font-display font-semibold">Notifications</div>
          {unread > 0 && <button className="text-xs text-primary hover:underline" onClick={markAllRead}><Check className="mr-1 inline h-3 w-3" />Mark all read</button>}
        </div>
        <div className="max-h-96 divide-y divide-border overflow-auto">
          {items.length === 0 && <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>}
          {items.map((n) => (
            <Link key={n.id} to={n.application_id ? `/dashboard/applications/${n.application_id}` : "/dashboard"}
              className={`block p-3 hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="text-sm font-medium">{n.title}</div>
              {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
              <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

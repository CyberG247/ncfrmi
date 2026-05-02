import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { browserNotify, ensureNotificationPermission } from "@/lib/notify";

type App = {
  id: string; reference: string; type: string; status: string;
  full_name: string; created_at: string; updated_at: string;
};

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-900",
  documents_required: "bg-orange-100 text-orange-900",
  interview_scheduled: "bg-purple-100 text-purple-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
  closed: "bg-gray-200 text-gray-800",
};

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureNotificationPermission();
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      setApps((data as App[]) || []);
      setLoading(false);
    };
    load();

    const ch = supabase.channel("apps-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const n = payload.new as App;
            const o = payload.old as App;
            setApps((prev) => prev.map((a) => (a.id === n.id ? n : a)));
            if (n.status !== o.status) browserNotify(`Status: ${pretty(n.status)}`, `${n.reference} updated`);
          } else if (payload.eventType === "INSERT") {
            setApps((prev) => [payload.new as App, ...prev]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <Layout>
      <PageHero eyebrow="Applicant Portal" title={`Welcome${user?.email ? `, ${user.email}` : ""}`} description="Track every application end-to-end with live status updates." />
      <section className="container-page py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl">Your applications</h2>
          <div className="flex gap-2">
            <Button asChild><Link to="/dashboard/new"><Plus className="mr-1 h-4 w-4" /> New application</Link></Button>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : apps.length === 0 ? (
          <Card><CardContent className="p-10 text-center">
            <p className="text-muted-foreground">You haven't started an application yet.</p>
            <Button asChild className="mt-4"><Link to="/dashboard/new">Start your first application</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {apps.map((a) => (
              <Card key={a.id} className="transition-base hover:shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">{a.reference}</div>
                    <div className="font-display text-lg font-semibold">{pretty(a.type)} application</div>
                    <div className="text-sm text-muted-foreground">Last update: {new Date(a.updated_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[a.status] || ""} variant="secondary">{pretty(a.status)}</Badge>
                    <Button asChild variant="outline" size="sm"><Link to={`/dashboard/applications/${a.id}`}>Track <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

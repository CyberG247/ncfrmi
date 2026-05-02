import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { browserNotify, ensureNotificationPermission } from "@/lib/notify";

const STAGES = ["submitted", "under_review", "documents_required", "interview_scheduled", "approved"] as const;

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type App = {
  id: string; reference: string; type: string; status: string; full_name: string;
  phone: string | null; state: string | null; lga: string | null; reason: string | null;
  created_at: string; updated_at: string; user_id: string;
};
type Evt = {
  id: string; event_type: string; from_status: string | null; to_status: string | null;
  note: string | null; created_at: string;
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState<App | null>(null);
  const [events, setEvents] = useState<Evt[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    ensureNotificationPermission();
    const load = async () => {
      const [{ data: a }, { data: ev }] = await Promise.all([
        supabase.from("applications").select("*").eq("id", id).maybeSingle(),
        supabase.from("application_events").select("*").eq("application_id", id).order("created_at", { ascending: true }),
      ]);
      setApp(a as App | null);
      setEvents((ev as Evt[]) || []);
    };
    load();

    const ch = supabase.channel(`app-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "applications", filter: `id=eq.${id}` },
        (p) => {
          const n = p.new as App, o = p.old as App;
          setApp(n);
          if (n.status !== o.status) browserNotify(`Status updated`, `${n.reference}: ${pretty(n.status)}`);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "application_events", filter: `application_id=eq.${id}` },
        (p) => setEvents((prev) => [...prev, p.new as Evt]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, user]);

  if (!app) return <Layout><div className="container-page py-20 text-center text-muted-foreground">Loading application…</div></Layout>;

  const currentIdx = STAGES.indexOf(app.status as any);
  const isRejected = app.status === "rejected" || app.status === "closed";

  return (
    <Layout>
      <PageHero eyebrow={app.reference} title={`${pretty(app.type)} application`} description={`Submitted ${new Date(app.created_at).toLocaleDateString()}`} />
      <section className="container-page py-12">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="outline" size="sm"><Link to="/dashboard">← Back to dashboard</Link></Button>
          <Badge variant="secondary" className="text-sm">{pretty(app.status)}</Badge>
        </div>

        {/* Progress tracker */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Progress</h3>
            <ol className="mt-6 grid gap-4 sm:grid-cols-5">
              {STAGES.map((s, i) => {
                const done = !isRejected && i <= currentIdx;
                const active = !isRejected && i === currentIdx;
                return (
                  <li key={s} className="flex flex-col items-center text-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : active ? <Clock className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <div className={`mt-2 text-xs font-medium ${active ? "text-primary" : ""}`}>{pretty(s)}</div>
                  </li>
                );
              })}
            </ol>
            {isRejected && <p className="mt-4 text-sm text-accent">This application is {pretty(app.status)}. Please contact your zonal office for more information.</p>}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold">Timeline</h3>
              <ol className="mt-5 space-y-5 border-l border-border pl-6">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                    <div className="text-sm font-medium">
                      {e.event_type === "created" ? "Application submitted" :
                        e.from_status ? `${pretty(e.from_status)} → ${pretty(e.to_status || "")}` : pretty(e.to_status || e.event_type)}
                    </div>
                    {e.note && <div className="mt-0.5 text-sm text-muted-foreground">{e.note}</div>}
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              <h3 className="font-display text-lg font-semibold">Case details</h3>
              <div><div className="text-muted-foreground">Applicant</div><div className="font-medium">{app.full_name}</div></div>
              <div><div className="text-muted-foreground">Phone</div><div>{app.phone || "—"}</div></div>
              <div><div className="text-muted-foreground">Location</div><div>{[app.lga, app.state].filter(Boolean).join(", ") || "—"}</div></div>
              {app.reason && <div><div className="text-muted-foreground">Reason</div><div className="whitespace-pre-wrap">{app.reason}</div></div>}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

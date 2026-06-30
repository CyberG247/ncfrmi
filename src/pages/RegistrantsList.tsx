import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Registrant = {
  id: string;
  reference: string;
  category: "idp" | "refugee" | "migrant" | "returnee";
  full_name: string;
  phone: string;
  state_origin: string;
  lga: string;
  gender: string;
  dependants: number;
  created_at: string;
};

const CATEGORY_META: Record<Registrant["category"], { label: string; cls: string }> = {
  idp: { label: "IDP", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  refugee: { label: "Refugee", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  migrant: { label: "Migrant", cls: "bg-violet-500/15 text-violet-700 border-violet-500/30" },
  returnee: { label: "Returnee", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
};

export default function RegistrantsList() {
  const [rows, setRows] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [state, setState] = useState<string>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrants")
        .select("id,reference,category,full_name,phone,state_origin,lga,gender,dependants,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!active) return;
      if (error) toast.error(error.message);
      setRows((data ?? []) as Registrant[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("registrants-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrants" }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === "INSERT") return [payload.new as Registrant, ...prev];
          if (payload.eventType === "UPDATE")
            return prev.map((r) => (r.id === (payload.new as Registrant).id ? (payload.new as Registrant) : r));
          if (payload.eventType === "DELETE") return prev.filter((r) => r.id !== (payload.old as Registrant).id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const states = useMemo(() => Array.from(new Set(rows.map((r) => r.state_origin))).sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (state !== "all" && r.state_origin !== state) return false;
      if (!needle) return true;
      return (
        r.full_name.toLowerCase().includes(needle) ||
        r.reference.toLowerCase().includes(needle) ||
        r.phone.toLowerCase().includes(needle) ||
        r.lga.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, cat, state]);

  const counts = useMemo(() => {
    const c = { idp: 0, refugee: 0, migrant: 0, returnee: 0 } as Record<Registrant["category"], number>;
    rows.forEach((r) => { c[r.category]++; });
    return c;
  }, [rows]);

  return (
    <Layout>
      <PageHero
        eyebrow="Field Operations"
        title="Registrants Directory"
        description="Search, filter and access full profiles of every person enrolled in the field — IDPs, refugees, migrants and returnees."
      />

      <section className="container-page py-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(CATEGORY_META) as Registrant["category"][]).map((k) => (
            <Card key={k} className="flex items-center justify-between p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{CATEGORY_META[k].label}</div>
                <div className="font-display text-2xl font-bold text-primary">{counts[k]}</div>
              </div>
              <Badge variant="outline" className={CATEGORY_META[k].cls}>{CATEGORY_META[k].label}</Badge>
            </Card>
          ))}
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
              <Users className="h-5 w-5" /> {filtered.length} registrant{filtered.length === 1 ? "" : "s"}
            </div>
            <Button asChild size="sm">
              <Link to="/field-capture"><UserPlus className="mr-2 h-4 w-4" /> New enrolment</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, reference, phone or LGA…" className="pl-9" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="idp">IDP</SelectItem>
                <SelectItem value="refugee">Refugee</SelectItem>
                <SelectItem value="migrant">Migrant</SelectItem>
                <SelectItem value="returnee">Returnee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue placeholder="State of origin" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Origin</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Dependants</TableHead>
                  <TableHead className="hidden md:table-cell">Enrolled</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No registrants match your filters.{" "}
                      <Link to="/field-capture" className="font-medium text-primary underline">Enrol a new person</Link>.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const meta = CATEGORY_META[r.category];
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                        <TableCell>
                          <div className="font-medium">{r.full_name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{r.gender}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={meta.cls}>{meta.label}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell">{r.state_origin} <span className="text-muted-foreground">/ {r.lga}</span></TableCell>
                        <TableCell className="hidden lg:table-cell">{r.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell">{r.dependants}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/registrants/${r.id}`}>View <ArrowRight className="ml-1 h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </Layout>
  );
}

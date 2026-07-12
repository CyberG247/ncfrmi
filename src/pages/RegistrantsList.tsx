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
import { ArrowRight, Search, UserPlus, Users, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/ncfrmi-logo.png";

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

      let localData: Registrant[] = [];
      try {
        localData = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      } catch (e) {
        console.error(e);
      }

      let merged: Registrant[] = [...localData];
      if (data) {
        const localRefs = new Set(localData.map(r => r.reference));
        const remoteFiltered = (data ?? []).filter((r: any) => !localRefs.has(r.reference));
        merged = [...localData, ...remoteFiltered] as Registrant[];
      }
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (error) {
        console.warn("Supabase fetch failed. Using local storage: ", error);
        if (localData.length === 0) {
          toast.error(error.message);
        } else {
          toast.info("Offline Mode: Showing locally captured registrants.");
        }
      }
      setRows(merged);
      setLoading(false);
    })();

    const channel = supabase
      .channel("registrants-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrants" }, (payload) => {
        setRows((prev) => {
          let updated = [...prev];
          if (payload.eventType === "INSERT") {
            const newRec = payload.new as Registrant;
            if (!updated.some(r => r.reference === newRec.reference)) {
              updated = [newRec, ...updated];
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedRec = payload.new as Registrant;
            updated = updated.map((r) => (r.id === updatedRec.id || r.reference === updatedRec.reference ? updatedRec : r));
          } else if (payload.eventType === "DELETE") {
            const deletedRec = payload.old as Registrant;
            updated = updated.filter((r) => r.id !== deletedRec.id && r.reference !== deletedRec.reference);
          }
          return updated;
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

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const headers = ["Reference", "Full Name", "Category", "State of Origin", "LGA", "Phone", "Dependants", "Enrolled Date"];
    const csvContent = [
      headers.join(","),
      ...filtered.map((r) => {
        const row = [
          `"${r.reference}"`,
          `"${r.full_name.replace(/"/g, '""')}"`,
          `"${r.category.toUpperCase()}"`,
          `"${r.state_origin.replace(/"/g, '""')}"`,
          `"${r.lga.replace(/"/g, '""')}"`,
          `"${r.phone}"`,
          r.dependants,
          `"${new Date(r.created_at).toLocaleDateString()}"`
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ncfrmi_registrants_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const exportPDF = () => {
    if (filtered.length === 0) {
      toast.info("No records to export.");
      return;
    }

    import("jspdf").then(async ({ jsPDF }) => {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Load logo
      try {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
          });
        };
        const logoImg = await loadImage(logo);
        doc.addImage(logoImg, "PNG", 12, 10, 12, 12);
      } catch (logoErr) {
        console.warn("Failed to load logo image for PDF", logoErr);
      }

      // Agency Branding
      doc.setTextColor(11, 102, 60); // Official Green
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("NATIONAL COMMISSION FOR REFUGEES, MIGRANTS AND INTERNALLY DISPLACED PERSONS", 28, 15);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("NCFRMI Headquarters · FCT Abuja", 28, 19);
      
      // Horizontal Gold divider line under header branding
      doc.setDrawColor(197, 160, 89); // Gold
      doc.setLineWidth(0.4);
      doc.line(12, 25, 285, 25);

      // Report Title & Metadata
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("REGISTRANTS DIRECTORY REPORT", 12, 32);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 37);
      doc.text(`Total Records: ${filtered.length}`, 12, 41);

      const cols = [
        { name: "Reference", x: 12, w: 45 },
        { name: "Full Name", x: 57, w: 60 },
        { name: "Category", x: 117, w: 25 },
        { name: "State / LGA", x: 142, w: 50 },
        { name: "Phone", x: 192, w: 35 },
        { name: "Deps", x: 227, w: 15 },
        { name: "Enrolled", x: 242, w: 38 },
      ];

      // Forest green table header
      let y = 46;
      doc.setFillColor(11, 102, 60);
      doc.rect(12, y, 273, 8, "F");
      // Gold table border line
      doc.setFillColor(197, 160, 89);
      doc.rect(12, y + 8, 273, 0.6, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      cols.forEach((col) => {
        doc.text(col.name, col.x + 2, y + 5);
      });

      y += 8.6;
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "normal");

      filtered.forEach((r, index) => {
        if (y > 180) {
          doc.addPage();
          
          // Re-draw header on new page
          doc.setFillColor(11, 102, 60);
          doc.rect(12, 15, 273, 8, "F");
          doc.setFillColor(197, 160, 89);
          doc.rect(12, 23, 273, 0.6, "F");
          
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          cols.forEach((col) => {
            doc.text(col.name, col.x + 2, 20);
          });
          y = 23.6;
          doc.setTextColor(15, 23, 42);
          doc.setFont("Helvetica", "normal");
        }

        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(12, y, 273, 7, "F");
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(12, y + 7, 285, y + 7);

        doc.text(r.reference, cols[0].x + 2, y + 4.5);
        
        let displayName = r.full_name;
        if (displayName.length > 26) displayName = displayName.slice(0, 24) + "...";
        doc.text(displayName, cols[1].x + 2, y + 4.5);
        
        doc.text(r.category.toUpperCase(), cols[2].x + 2, y + 4.5);
        
        const origin = `${r.state_origin} / ${r.lga}`;
        let displayOrigin = origin;
        if (displayOrigin.length > 24) displayOrigin = displayOrigin.slice(0, 22) + "...";
        doc.text(displayOrigin, cols[3].x + 2, y + 4.5);
        
        doc.text(r.phone, cols[4].x + 2, y + 4.5);
        doc.text(String(r.dependants), cols[5].x + 2, y + 4.5);
        doc.text(new Date(r.created_at).toLocaleDateString(), cols[6].x + 2, y + 4.5);

        y += 7;
      });

      doc.save(`ncfrmi_registrants_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report generated successfully");
    }).catch((err) => {
      console.error(err);
      toast.error("Failed to load PDF library");
    });
  };

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
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportCSV} variant="outline" size="sm" className="h-9">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={exportPDF} variant="outline" size="sm" className="h-9">
                <FileText className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link to="/field-capture"><UserPlus className="mr-2 h-4 w-4" /> New enrolment</Link>
              </Button>
            </div>
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

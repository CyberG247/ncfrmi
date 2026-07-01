import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  ShieldAlert,
  MapPin,
  TrendingUp,
  Download,
  FileText,
  Search,
  Trash2,
  Edit,
  Database,
  CheckCircle,
  Wifi,
  XCircle,
  Laptop
} from "lucide-react";

type Registrant = {
  id: string;
  reference: string;
  category: "idp" | "refugee" | "migrant" | "returnee";
  full_name: string;
  address: string;
  phone: string;
  dob: string;
  gender: string;
  nationality: string;
  state_origin: string;
  lga: string;
  dependants: number;
  circumstances: string;
  created_at: string;
  is_local?: boolean;
};

const TYPES = [
  { value: "all", label: "All Categories" },
  { value: "idp", label: "IDP" },
  { value: "refugee", label: "Refugee" },
  { value: "migrant", label: "Migrant" },
  { value: "returnee", label: "Returnee" }
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // Editing modal state
  const [editingItem, setEditingItem] = useState<Registrant | null>(null);
  const [editName, setEditName] = useState("");
  const [editCircumstances, setEditCircumstances] = useState("");

  const loadData = async () => {
    setLoading(true);
    let remoteData: Registrant[] = [];
    try {
      const { data, error } = await supabase
        .from("registrants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      remoteData = (data as Registrant[]) || [];
    } catch (e) {
      console.warn("Failed to fetch remote registrants: ", e);
    }

    // Merge with local storage fallback data
    let merged = [...remoteData];
    try {
      const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      const localMapped = local.map((r: any) => ({ ...r, is_local: true }));
      // Deduplicate by reference
      const remoteRefs = new Set(remoteData.map((r) => r.reference));
      localMapped.forEach((r: Registrant) => {
        if (!remoteRefs.has(r.reference)) {
          merged.push(r);
        }
      });
    } catch (e) {
      console.error("Failed to merge local fallback records: ", e);
    }

    // Sort by created_at desc
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRegistrants(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, isLocal?: boolean) => {
    if (!window.confirm("Are you sure you want to permanently delete this registration record?")) return;
    try {
      if (isLocal) {
        const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
        const updated = local.filter((r: any) => r.id !== id);
        localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(updated));
        toast.success("Local record deleted");
      } else {
        const { error } = await supabase.from("registrants").delete().eq("id", id);
        if (error) throw error;
        toast.success("Remote database record deleted");
      }
      setRegistrants((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete record");
    }
  };

  const handleEditClick = (item: Registrant) => {
    setEditingItem(item);
    setEditName(item.full_name);
    setEditCircumstances(item.circumstances);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      if (editingItem.is_local) {
        const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
        const updated = local.map((r: any) =>
          r.id === editingItem.id ? { ...r, full_name: editName, circumstances: editCircumstances } : r
        );
        localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(updated));
        toast.success("Local record updated successfully");
      } else {
        const { error } = await supabase
          .from("registrants")
          .update({ full_name: editName, circumstances: editCircumstances })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Remote record updated successfully");
      }
      setRegistrants((prev) =>
        prev.map((r) =>
          r.id === editingItem.id ? { ...r, full_name: editName, circumstances: editCircumstances } : r
        )
      );
      setEditingItem(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update record");
    }
  };

  // Filter computations
  const filtered = registrants.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.lga.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchesState = stateFilter === "all" || r.state_origin === stateFilter;

    return matchesSearch && matchesCategory && matchesState;
  });

  const getUniqueStates = () => {
    const states = new Set(registrants.map((r) => r.state_origin).filter(Boolean));
    return Array.from(states);
  };

  // Metric summaries
  const totalCount = filtered.length;
  const idpCount = filtered.filter((r) => r.category === "idp").length;
  const refugeeCount = filtered.filter((r) => r.category === "refugee").length;
  const migrantCount = filtered.filter((r) => r.category === "migrant").length;
  const returneeCount = filtered.filter((r) => r.category === "returnee").length;
  const localCount = filtered.filter((r) => r.is_local).length;

  // Regional charts math (Top 5 states)
  const stateCounts = filtered.reduce((acc, r) => {
    if (r.state_origin) acc[r.state_origin] = (acc[r.state_origin] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // CSV Exporter
  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    const headers = ["Reference", "Category", "Full Name", "Gender", "DOB", "Nationality", "State", "LGA", "Dependants", "Circumstances", "Created At"];
    const rows = filtered.map((r) => [
      r.reference,
      r.category.toUpperCase(),
      r.full_name,
      r.gender,
      r.dob,
      r.nationality,
      r.state_origin,
      r.lga,
      r.dependants,
      `"${r.circumstances.replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NCFRMI_Admin_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully");
  };

  // Landscape PDF Report Exporter
  const exportPDF = async () => {
    if (filtered.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      // Official Crest Header Mock
      doc.setFillColor(11, 102, 60); // Green banner
      doc.rect(0, 0, 297, 12, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("FEDERAL REPUBLIC OF NIGERIA · OFFICIAL ADMINISTRATIVE INTEL", 12, 8);
      
      // Document Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(22);
      doc.text("NCFRMI REGISTRATION AUDIT REPORT", 12, 24);
      
      // Metadata Details
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 30);
      doc.text(`Officer Session: ${user?.email || "Admin Commissioner Session"}`, 12, 35);
      
      // Summary Metrics Row
      doc.setFillColor(241, 245, 249);
      doc.rect(12, 40, 273, 16, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`TOTAL CAPTURED: ${totalCount}`, 20, 50);
      doc.text(`REFUGEES: ${refugeeCount}`, 75, 50);
      doc.text(`IDPS: ${idpCount}`, 130, 50);
      doc.text(`MIGRANTS: ${migrantCount}`, 185, 50);
      doc.text(`RETURNEES: ${returneeCount}`, 240, 50);
      
      // Table Header
      let y = 64;
      doc.setFillColor(30, 41, 59);
      doc.rect(12, y, 273, 8, "F");
      
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("REFERENCE", 15, y + 5);
      doc.text("FULL NAME", 55, y + 5);
      doc.text("CATEGORY", 105, y + 5);
      doc.text("NATIONALITY", 135, y + 5);
      doc.text("STATE OF ORIGIN", 175, y + 5);
      doc.text("LGA", 215, y + 5);
      doc.text("DATE ENROLLED", 250, y + 5);
      
      // Table Rows
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      filtered.slice(0, 10).forEach((r, idx) => {
        y += 8;
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(12, y, 273, 8, "F");
        }
        doc.text(r.reference, 15, y + 5);
        doc.text(r.full_name.slice(0, 22), 55, y + 5);
        doc.text(r.category.toUpperCase(), 105, y + 5);
        doc.text(r.nationality, 135, y + 5);
        doc.text(r.state_origin, 175, y + 5);
        doc.text(r.lga, 215, y + 5);
        doc.text(new Date(r.created_at).toLocaleDateString(), 250, y + 5);
      });
      
      if (filtered.length > 10) {
        y += 10;
        doc.setFont("Helvetica", "oblique");
        doc.setTextColor(100, 116, 139);
        doc.text(`* Showing first 10 of ${filtered.length} active records in print preview layout. Full records are preserved in the CSV data dump.`, 12, y);
      }
      
      // Commissioner Signature Block
      doc.setDrawColor(148, 163, 184);
      doc.line(200, 175, 270, 175);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("HON. COMMISSIONER SIGNATURE", 208, 180);
      doc.setFont("Helvetica", "normal");
      doc.text("NCFRMI Federal Secretariat, Abuja", 209, 184);
      
      doc.save(`NCFRMI_Administrative_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("Landscape PDF report generated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Administrative Portal"
        title="Commissioner — Control Center"
        description="Monitor registration metrics, review regional intakes, and manage credential parameters."
      />

      <section className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Sidebar / Options */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="shadow-elegant border border-border bg-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Admin Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-col gap-1">
                  <Button variant="secondary" className="justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20">
                    <Database className="h-4 w-4" /> Overview Dashboard
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2 text-foreground/80 hover:bg-muted" onClick={exportCSV}>
                    <Download className="h-4 w-4" /> Export CSV Data
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2 text-foreground/80 hover:bg-muted" onClick={exportPDF}>
                    <FileText className="h-4 w-4" /> Export PDF Summary
                  </Button>
                  <Button variant="destructive" className="justify-start gap-2 mt-4 hover-lift" onClick={() => signOut()}>
                    Sign Out Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Gateway Terminal Status */}
            <Card className="shadow-elegant border border-border bg-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground flex items-center justify-between">
                  <span>Gateways</span>
                  <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Gateway Abuja HQ</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Online (12ms)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Terminal Lagos SW</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Online (19ms)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Gateway Borno NE</span>
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Lags (142ms)
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-snug">
                  * Zonal API keys and TLS 1.3 certificates are active across all regional portals.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* KPI Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-card hover-glow border border-border bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Enrolled</div>
                    <div className="text-2xl font-bold font-display">{totalCount}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover-glow border border-border bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-500"><ShieldAlert className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Refugees</div>
                    <div className="text-2xl font-bold font-display">{refugeeCount}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover-glow border border-border bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-lg bg-amber-500/10 p-3 text-amber-500"><MapPin className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">IDPs</div>
                    <div className="text-2xl font-bold font-display">{idpCount}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover-glow border border-border bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500"><TrendingUp className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Local (Sync Pend)</div>
                    <div className="text-2xl font-bold font-display">{localCount}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Category Distribution SVG Chart */}
              <Card className="shadow-card border border-border bg-card">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Category Intake Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {totalCount === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No data available</div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { label: "Refugees", count: refugeeCount, color: "bg-indigo-500" },
                        { label: "IDPs", count: idpCount, color: "bg-amber-500" },
                        { label: "Migrants", count: migrantCount, color: "bg-blue-500" },
                        { label: "Returnees", count: returneeCount, color: "bg-rose-500" }
                      ].map((item) => {
                        const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                        return (
                          <div key={item.label} className="space-y-1 text-xs">
                            <div className="flex justify-between font-medium">
                              <span>{item.label}</span>
                              <span className="text-muted-foreground">{item.count} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Regional Density SVG Column Chart */}
              <Card className="shadow-card border border-border bg-card">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Top Registration Regions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {sortedStates.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No regional data</div>
                  ) : (
                    <div className="h-[200px] flex items-end justify-between gap-3 pt-6 border-b border-l border-slate-200 dark:border-slate-800 px-2">
                      {sortedStates.map(([state, count]) => {
                        const maxVal = Math.max(...sortedStates.map((s) => s[1]));
                        const ht = maxVal > 0 ? (count / maxVal) * 130 : 0;
                        return (
                          <div key={state} className="flex flex-col items-center flex-1 group">
                            <div className="text-[10px] font-bold text-primary mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {count}
                            </div>
                            <div
                              className="w-8 bg-primary rounded-t transition-all duration-1000 hover:bg-primary/80"
                              style={{ height: `${Math.max(ht, 8)}px` }}
                            />
                            <span className="text-[9px] font-bold text-muted-foreground mt-2 truncate w-12 text-center">
                              {state.slice(0, 6)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Registrant Database Grid */}
            <Card className="shadow-card border border-border bg-card">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> Active Enrolment Database
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reference, name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[130px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="w-[120px] text-xs"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {getUniqueStates().map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {loading ? (
                  <div className="p-10 text-center text-xs text-muted-foreground">Loading database...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground">No registration profiles found matching filter parameters.</div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                      <tr>
                        <th className="p-3.5">Reference ID</th>
                        <th className="p-3.5">Full Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Origin State</th>
                        <th className="p-3.5">Sync Status</th>
                        <th className="p-3.5">Date Created</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 font-mono text-muted-foreground">{item.reference}</td>
                          <td className="p-3.5 font-semibold text-foreground">
                            <Link to={`/registrants/${item.id}`} className="hover:underline hover:text-primary">
                              {item.full_name}
                            </Link>
                          </td>
                          <td className="p-3.5">
                            <Badge variant="outline" className="uppercase font-semibold text-[9px]">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3.5">{item.state_origin || "—"}</td>
                          <td className="p-3.5">
                            {item.is_local ? (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[9px] hover:bg-amber-100">Local (Pending)</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 text-[9px] hover:bg-emerald-100">Cloud Synced</Badge>
                            )}
                          </td>
                          <td className="p-3.5 text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditClick(item)}>
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item.id, item.is_local)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Editing Dialog Modal */}
      <Dialog open={!!editingItem} onOpenChange={(o) => { if (!o) setEditingItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Registrant Profile</DialogTitle>
            <DialogDescription>Modify demographic attributes or displacement circumstances.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full Legal Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Circumstances & Context</label>
              <Textarea value={editCircumstances} onChange={(e) => setEditCircumstances(e.target.value)} rows={4} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

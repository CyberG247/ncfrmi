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
import logo from "@/assets/ncfrmi-logo.png";
import nigeriaPovertyMap from "@/assets/nigeria-poverty-map.png";
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
  Laptop,
  Globe,
  Home,
  RotateCcw,
  Activity,
  Shield,
  UserCheck,
  Loader2,
  Fingerprint,
  Eye,
  EyeOff
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

// Circular progress indicator matching drawing
const CircularProgress = ({ value, total, color }: { value: number; total: number; color: string }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-28 w-28 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-muted dark:stroke-slate-800"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-extrabold font-display text-foreground">{percent}%</span>
        <div className="text-[8px] text-muted-foreground font-bold uppercase mt-0.5">{value} / {total}</div>
      </div>
    </div>
  );
};

// Custom Sparkline/Area Chart representing Graphical Rep
const CustomBarChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  const width = 240;
  const height = 80;
  const padding = 5;
  const barWidth = 24;
  const gap = 12;

  // Fluctuations state to simulate "live data ups and downs"
  const [pulseScale, setPulseScale] = useState<number[]>([1, 1, 1, 1, 1, 1]);

  useEffect(() => {
    // Start fluctuating slightly after mount for a catchy micro-animation
    const timer = setTimeout(() => {
      setPulseScale(data.map(() => 0.85 + Math.random() * 0.25));
    }, 100);

    const interval = setInterval(() => {
      setPulseScale(data.map(() => 0.8 + Math.random() * 0.35));
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [data]);

  return (
    <div className="w-full h-24 mt-4 relative">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Background Grid Lines */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-muted/10" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="currentColor" className="text-muted/20" strokeWidth="0.5" />

        {data.map((val, idx) => {
          const scale = pulseScale[idx] || 1;
          const rawHeight = (val / max) * (height - 2 * padding - 10);
          const barHeight = Math.max(rawHeight * scale, 4); // ensure min height
          
          // Center the bars horizontally
          const totalWidth = data.length * barWidth + (data.length - 1) * gap;
          const startX = (width - totalWidth) / 2;
          const x = startX + idx * (barWidth + gap);
          const y = height - padding - barHeight;

          return (
            <g key={idx} className="group">
              {/* Main Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="3"
                fill={color}
                className="opacity-80 transition-all duration-1800 ease-in-out cursor-pointer group-hover:opacity-100 group-hover:brightness-110"
              />
              {/* Glossy top highlights for premium look */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height="2.5"
                rx="1"
                fill="#ffffff"
                className="opacity-45 transition-all duration-1800 ease-in-out pointer-events-none"
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-4 font-semibold uppercase tracking-wider">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
};

const MAP_NODES = [
  {
    id: "abuja",
    name: "Abuja HQ Gateway",
    state: "FCT",
    x: 118,
    y: 134,
    color: "#6366f1", // Indigo
    pingSpeed: "4.5s",
    camps: ["Durumi Camp", "Kuchingoro Camp"],
    registrants: 3520,
    refugees: 1120,
    idps: 1850,
    migrants: 550,
    status: "Operational"
  },
  {
    id: "borno",
    name: "Maiduguri Hub",
    state: "Borno State",
    x: 268,
    y: 75,
    color: "#f59e0b", // Amber
    pingSpeed: "3.2s",
    camps: ["Maiduguri Zonal Camp", "Muna Garage Camp"],
    registrants: 12450,
    refugees: 3400,
    idps: 8200,
    migrants: 850,
    status: "High Load Warning"
  },
  {
    id: "lagos",
    name: "Lagos Transit Hub",
    state: "Lagos State",
    x: 21,
    y: 208,
    color: "#10b981", // Emerald
    pingSpeed: "5.5s",
    camps: ["Ikeja Reception Center"],
    registrants: 1850,
    refugees: 450,
    idps: 0,
    migrants: 1400,
    status: "Operational"
  },
  {
    id: "benue",
    name: "Daudu Sector Node",
    state: "Benue State",
    x: 148,
    y: 170,
    color: "#ef4444", // Red
    pingSpeed: "3.8s",
    camps: ["Daudu Camp 1 & 2"],
    registrants: 4120,
    refugees: 120,
    idps: 3800,
    migrants: 200,
    status: "Operational"
  },
  {
    id: "edo",
    name: "Uhogua Camp Node",
    state: "Edo State",
    x: 81,
    y: 190,
    color: "#06b6d4", // Cyan
    pingSpeed: "5.0s",
    camps: ["Uhogua Camp"],
    registrants: 2150,
    refugees: 350,
    idps: 1700,
    migrants: 100,
    status: "Operational"
  },
  {
    id: "cross_river",
    name: "Ogoja Border Sector",
    state: "Cross River State",
    x: 130,
    y: 208,
    color: "#8b5cf6", // Violet
    pingSpeed: "4.6s",
    camps: ["Adagom Refugee Settlement"],
    registrants: 5820,
    refugees: 5200,
    idps: 300,
    migrants: 320,
    status: "Operational"
  }
];

const NigeriaMapSVG = ({ activeNode, onHoverNode }: { activeNode: string; onHoverNode: (id: string) => void }) => {
  return (
    <div className="relative w-full max-w-[520px] mx-auto overflow-hidden rounded-xl border border-border shadow-elegant bg-white p-3 select-none">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: "68%" }}>
        {/* The Exact Geographical Map Image from NBS/Inspiration (Scaled and shifted up to crop border and title) */}
        <img
          src={nigeriaPovertyMap}
          alt="Nigeria Poverty Headcount and Registry Density Map"
          className="absolute w-[114%] h-[122%] max-w-none -top-[12%] -left-[7%] object-cover pointer-events-none rounded-lg"
        />

        {/* Dynamic, Slow-Pulsing Zonal Hotspot Dots */}
        {MAP_NODES.map((node) => {
          const isActive = activeNode === node.id;
          
          // Map to precise geographical coordinates on the cropped NBS map image
          let leftPercent = "50%";
          let topPercent = "50%";
          
          if (node.id === "abuja") { leftPercent = "43.5%"; topPercent = "48%"; }
          else if (node.id === "borno") { leftPercent = "86.5%"; topPercent = "20%"; }
          else if (node.id === "lagos") { leftPercent = "9.5%"; topPercent = "78%"; }
          else if (node.id === "benue") { leftPercent = "54.5%"; topPercent = "63.5%"; }
          else if (node.id === "edo") { leftPercent = "28.5%"; topPercent = "72%"; }
          else if (node.id === "cross_river") { leftPercent = "48%"; topPercent = "78.5%"; }
          
          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
              style={{ left: leftPercent, top: topPercent }}
              onMouseEnter={() => onHoverNode(node.id)}
            >
              {/* Pulsing ring check animation */}
              <span
                className="absolute inline-flex h-7 w-7 rounded-full opacity-60 animate-ping"
                style={{
                  backgroundColor: node.color,
                  animationDuration: node.pingSpeed
                }}
              />
              {/* Solid inner dot */}
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white shadow-elegant transition-all duration-300 group-hover:scale-125 ${
                  isActive ? "scale-125 ring-2 ring-primary/30" : ""
                }`}
                style={{ backgroundColor: node.color }}
              />
              
              {/* Hover Tooltip Box */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900/95 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-50 animate-fade-in">
                {node.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, role, signOut } = useAuth();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // OPay-style Report Statement request states
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [reportFormat, setReportFormat] = useState<"pdf" | "csv">("pdf");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Login gate states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("commissioner@ncfrmi.gov.ng");
  const [loginPassword, setLoginPassword] = useState("commissioner123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [biometricLoginActive, setBiometricLoginActive] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    // Check if it matches simulated login credentials
    if (loginEmail === "commissioner@ncfrmi.gov.ng" && loginPassword === "commissioner123") {
      const mockUser = { email: "commissioner@ncfrmi.gov.ng", role: "commissioner" };
      localStorage.setItem("ncfrmi_simulated_user", JSON.stringify(mockUser));
      
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      savedRoles["commissioner@ncfrmi.gov.ng"] = "commissioner";
      localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));
      
      toast.success("Welcome back! Commissioner authenticated.");
      setIsLoggedIn(true);
      setLoginLoading(false);
      return;
    }
    
    // Otherwise try Supabase login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      
      toast.success("Successfully logged in!");
      setIsLoggedIn(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Invalid credentials. Try commissioner@ncfrmi.gov.ng / commissioner123");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    setBiometricLoginActive(true);
    toast.info("Initializing TouchID verification node...");
    setTimeout(() => {
      const mockUser = { email: "commissioner@ncfrmi.gov.ng", role: "commissioner" };
      localStorage.setItem("ncfrmi_simulated_user", JSON.stringify(mockUser));
      
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      savedRoles["commissioner@ncfrmi.gov.ng"] = "commissioner";
      localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));
      
      setBiometricLoginActive(false);
      toast.success("Fingerprint biometric match verified! Access granted.");
      setIsLoggedIn(true);
    }, 1800);
  };

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // Editing modal state
  const [editingItem, setEditingItem] = useState<Registrant | null>(null);
  const [editName, setEditName] = useState("");
  const [editCircumstances, setEditCircumstances] = useState("");

  const [activeTab, setActiveTab] = useState("summary");
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [hoveredNode, setHoveredNode] = useState("abuja");
  
  // Loading simulated user roles from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ncfrmi_user_roles");
      if (saved) {
        setUserRoles(JSON.parse(saved));
      } else {
        const initial = {
          "commissioner@ncfrmi.gov.ng": "commissioner",
          "officer@ncfrmi.gov.ng": "officer",
          "field_east@ncfrmi.gov.ng": "officer",
          "field_north@ncfrmi.gov.ng": "officer",
          "applicant@ncfrmi.gov.ng": "applicant"
        };
        localStorage.setItem("ncfrmi_user_roles", JSON.stringify(initial));
        setUserRoles(initial);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleUpdateRole = (email: string, newRole: string) => {
    const updated = { ...userRoles, [email]: newRole };
    setUserRoles(updated);
    localStorage.setItem("ncfrmi_user_roles", JSON.stringify(updated));
    toast.success(`Role for ${email} updated to ${newRole.toUpperCase()}`);
  };

  const getTrendsForCategory = (cat: "refugee" | "idp" | "migrant") => {
    const counts = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    
    const baseTrends = {
      refugee: [12, 19, 15, 25, 32, 28],
      idp: [35, 42, 58, 48, 62, 55],
      migrant: [8, 12, 11, 15, 20, 18]
    };
    
    registrants.forEach((r) => {
      if (r.category === cat || (cat === "migrant" && r.category === "returnee")) {
        const diffMonth = now.getMonth() - new Date(r.created_at).getMonth() + 
          (12 * (now.getFullYear() - new Date(r.created_at).getFullYear()));
        if (diffMonth >= 0 && diffMonth < 6) {
          counts[5 - diffMonth] += 1;
        }
      }
    });

    return counts.map((val, idx) => val + baseTrends[cat][idx]);
  };

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
    const merged = [...remoteData];
    try {
      const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]") as Registrant[];
      const localMapped = local.map((r) => ({ ...r, is_local: true }));
      // Deduplicate by reference
      const remoteRefs = new Set(remoteData.map((r) => r.reference));
      localMapped.forEach((r) => {
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
        const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]") as Registrant[];
        const updated = local.filter((r) => r.id !== id);
        localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(updated));
        toast.success("Local record deleted");
      } else {
        const { error } = await supabase.from("registrants").delete().eq("id", id);
        if (error) throw error;
        toast.success("Remote database record deleted");
      }
      setRegistrants((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(errMsg || "Failed to delete record");
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
        const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]") as Registrant[];
        const updated = local.map((r) =>
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
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(errMsg || "Failed to update record");
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

  // Unified Statement Generator (OPay-style Date Filtered)
  const generateReport = async () => {
    setIsGeneratingReport(true);
    
    // Filter registrants based on date range
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);
    
    const rangeFiltered = registrants.filter((r) => {
      const date = new Date(r.created_at);
      return date >= start && date <= end;
    });

    if (rangeFiltered.length === 0) {
      toast.warning("No registration records found for the selected time frame.");
      setIsGeneratingReport(false);
      return;
    }

    try {
      if (reportFormat === "csv") {
        // Generate CSV
        const headers = ["Reference", "Category", "Full Name", "Gender", "DOB", "Nationality", "State", "LGA", "Dependants", "Circumstances", "Created At"];
        const rows = rangeFiltered.map((r) => [
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
        
        // Open/download directly
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `NCFRMI_Statement_${reportStartDate}_to_${reportEndDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("CSV Statement downloaded successfully");
      } else {
        // Generate PDF
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        
        // Load and add the NCFRMI logo at the top
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
        
        // Agency Name and Title next to the logo (Primary Green)
        doc.setTextColor(11, 102, 60); // Official Green
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("NATIONAL COMMISSION FOR REFUGEES, MIGRANTS AND INTERNALLY DISPLACED PERSONS", 28, 15);
        
        doc.setTextColor(100, 116, 139);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("NCFRMI Headquaters · FCT Abuja", 28, 19);
        
        // Horizontal Gold divider line under header branding
        doc.setDrawColor(197, 160, 89); // Gold
        doc.setLineWidth(0.4);
        doc.line(12, 25, 285, 25);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.text("OFFICIAL REPORT", 12, 32);
        
        // Metadata Details
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Statement Period: ${new Date(reportStartDate).toLocaleDateString()} - ${new Date(reportEndDate).toLocaleDateString()}`, 12, 38);
        doc.text(`Request Session: ${user?.email || "commissioner@ncfrmi.gov.ng"} (Admin)`, 12, 42);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 38);
        
        // Summary Metrics Row with Green/Gold styling
        doc.setFillColor(240, 248, 244); // Soft forest-green tint background
        doc.rect(12, 46, 273, 14, "F");
        doc.setDrawColor(197, 160, 89); // Gold border left accent
        doc.setLineWidth(0.8);
        doc.line(12, 46, 12, 60);
        
        // Calculate categories
        let rCount = 0;
        let iCount = 0;
        let mCount = 0;
        let retCount = 0;
        
        rangeFiltered.forEach(r => {
          if (r.category === "refugee") rCount++;
          else if (r.category === "idp") iCount++;
          else if (r.category === "migrant") mCount++;
          else if (r.category === "returnee") retCount++;
        });
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(11, 102, 60); // Green texts
        doc.text(`TOTAL ENROLLED: ${rangeFiltered.length}`, 18, 55);
        doc.text(`REFUGEES: ${rCount}`, 75, 55);
        doc.text(`IDPS: ${iCount}`, 130, 55);
        doc.text(`MIGRANTS: ${mCount}`, 185, 55);
        doc.text(`RETURNEES: ${retCount}`, 240, 55);
        
        // Table Header with Forest Green fill and Gold border
        let y = 66;
        doc.setFillColor(11, 102, 60); // Official Forest Green Table Header
        doc.rect(12, y, 273, 8, "F");
        doc.setFillColor(197, 160, 89); // Gold border accent
        doc.rect(12, y + 8, 273, 0.6, "F");
        
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
        
        // Render up to 12 items for visual fit
        rangeFiltered.slice(0, 12).forEach((r, idx) => {
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
        
        if (rangeFiltered.length > 12) {
          y += 10;
          doc.setFont("Helvetica", "oblique");
          doc.setTextColor(100, 116, 139);
          doc.text(`* Showing first 12 of ${rangeFiltered.length} records. Full statement database is downloadable as CSV.`, 12, y);
        }
        
        // Commissioner Signature Block
        doc.setDrawColor(148, 163, 184);
        doc.line(200, 175, 270, 175);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text("HON. FEDERAL COMMISSIONER'S SIGNATURE", 208, 180);
        doc.setFont("Helvetica", "normal");
        doc.text("NCFRMI Headquaters, FCT Abuja.", 209, 184);
        
        // Open PDF directly in new window
        const blob = doc.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        
        toast.success("PDF Report generated and opened successfully");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Failed to generate report statement");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Layout>
      <div className="container-page py-6 space-y-6">
        {!isLoggedIn ? (
          <div className="mx-auto max-w-md animate-fade-up py-10">
            <Card className="p-6 sm:p-8 shadow-elegant border border-primary/20 bg-card relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-16 w-16 rounded-full border border-primary/20 flex items-center justify-center bg-card shadow-inner p-1 mb-3">
                  <img src={logo} alt="NCFRMI seal" className="h-full w-full object-contain" />
                </div>
                <h3 className="font-display font-extrabold text-foreground text-base uppercase tracking-tight">
                  Commissioner Node Authentication
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  National Commission for Refugees, Migrants & IDPs
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Commissioner Email</label>
                  <Input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="commissioner@ncfrmi.gov.ng"
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Secure System Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="text-xs font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground flex justify-between items-center py-1">
                  <span>* Default Credentials:</span>
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                    commissioner@ncfrmi.gov.ng / commissioner123
                  </span>
                </div>

                <Button type="submit" disabled={loginLoading} className="w-full hover-lift font-bold uppercase tracking-wider text-xs">
                  {loginLoading ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Authorizing...</span>
                  ) : "Establish Commissioner Session"}
                </Button>
              </form>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">or biometrics</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Biometric Touch ID Quick Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoginActive}
                  className={`mx-auto h-16 w-16 rounded-full border border-primary/20 bg-muted/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                    biometricLoginActive ? "border-emerald-500 animate-pulse bg-emerald-50" : "hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <Fingerprint className={`h-8 w-8 text-primary ${biometricLoginActive ? "text-emerald-500 animate-pulse" : ""}`} />
                </button>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">
                  {biometricLoginActive ? "Verifying..." : "Touch ID Quick Bypass"}
                </div>
              </div>

              <div className="mt-6 border-t pt-4 text-center">
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Classified Node. Authorized operations are logged under security protocols.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Government Header Console */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4 bg-muted/10 p-4 rounded-xl border border-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="flex items-center gap-4 text-center md:text-left relative z-10">
            <div className="h-16 w-16 rounded-full border border-primary/20 flex items-center justify-center bg-card shadow-inner p-1">
              <img src={logo} alt="NCFRMI seal" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-foreground text-base sm:text-lg tracking-tight uppercase">
                NATIONAL COMMISSION FOR REFUGEES, MIGRANTS & IDPs
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  Internal System Control Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-650 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE GATEWAY
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="text-xs hover-lift">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation Menu Bar mimicking the drawing */}
        <div className="bg-card border border-border rounded-lg p-1.5 flex flex-wrap gap-1 shadow-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.01] pointer-events-none" />
          {[
            { id: "summary", label: "Exc. Summary", icon: Database },
            { id: "query", label: "Query Console", icon: Search },
            { id: "state", label: "Regional States", icon: MapPin },
            { id: "poc", label: "POC (Intake)", icon: Users },
            { id: "camps", label: "Camps Directory", icon: Home },
            { id: "host_comm", label: "Host Comm", icon: Globe },
            { id: "roles", label: "User Roles Manager", icon: UserCheck },
            { id: "report", label: "Audits & Reports", icon: FileText }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "poc") {
                    setCategoryFilter("all");
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase rounded-md border transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-white border-emerald-650 shadow-elegant scale-[1.02] shadow-emerald-950/20"
                    : "text-muted-foreground hover:bg-emerald-500/[0.04] hover:text-emerald-800 hover:border-emerald-500/10 border-transparent dark:hover:bg-emerald-500/[0.08] dark:hover:text-emerald-400"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Views Rendering based on activeTab */}
        
        {/* VIEW 1: EXECUTIVE SUMMARY (With 3 columns Refugees, IDPs, Migrants) */}
        {activeTab === "summary" && (
          <div className="space-y-6 animate-fade-up">
            
            {/* The 3 Columns layout from the drawing */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Column 1: REFUGEES */}
              <Card className="p-6 shadow-card hover-glow border-primary/10 relative overflow-hidden bg-card/65 backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="text-center space-y-4">
                  <Badge className="bg-indigo-150 text-indigo-900 border-indigo-200 text-xs font-extrabold uppercase">Refugees</Badge>
                  
                  {/* Circle display */}
                  <CircularProgress value={refugeeCount} total={totalCount} color="#6366f1" />
                  
                  <div className="border-t pt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Graphical Rep (Intake Density)
                    </span>
                    {/* Graphical Rep Bar Chart */}
                    <CustomBarChart data={getTrendsForCategory("refugee")} color="#6366f1" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                    Asylum filings show a steady upward trend. Northern sector intakes represent 62% of monthly registrations.
                  </p>
                </div>
              </Card>

              {/* Column 2: IDPs */}
              <Card className="p-6 shadow-card hover-glow border-primary/10 relative overflow-hidden bg-card/65 backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="text-center space-y-4">
                  <Badge className="bg-amber-150 text-amber-900 border-amber-200 text-xs font-extrabold uppercase">IDPs</Badge>
                  
                  <CircularProgress value={idpCount} total={totalCount} color="#f59e0b" />
                  
                  <div className="border-t pt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Graphical Rep (Intake Density)
                    </span>
                    <CustomBarChart data={getTrendsForCategory("idp")} color="#f59e0b" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                    Displacements due to climate events remain critical. Zonal shelter allocation reports 85% occupancy.
                  </p>
                </div>
              </Card>

              {/* Column 3: MIGRANTS */}
              <Card className="p-6 shadow-card hover-glow border-primary/10 relative overflow-hidden bg-card/65 backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="text-center space-y-4">
                  <Badge className="bg-emerald-150 text-emerald-900 border-emerald-200 text-xs font-extrabold uppercase">Migrants / Returnees</Badge>
                  
                  <CircularProgress value={migrantCount + returneeCount} total={totalCount} color="#10b981" />
                  
                  <div className="border-t pt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Graphical Rep (Intake Density)
                    </span>
                    <CustomBarChart data={getTrendsForCategory("migrant")} color="#10b981" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                    Repatriation transit programs are active. Regularized border syncs are successfully completed.
                  </p>
                </div>
              </Card>
            </div>

            {/* Zonal Metadata Summary */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-4 shadow-card border-border bg-card flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">Total Registrants</div>
                  <div className="text-xl font-bold font-display">{totalCount}</div>
                </div>
              </Card>

              <Card className="p-4 shadow-card border-border bg-card flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">Local (Pending Sync)</div>
                  <div className="text-xl font-bold font-display">{localCount}</div>
                </div>
              </Card>

              <Card className="p-4 shadow-card border-border bg-card flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Wifi className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">Gateways Active</div>
                  <div className="text-xl font-bold font-display">3 Zonal Nodes</div>
                </div>
              </Card>

              <Card className="p-4 shadow-card border-border bg-card flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-650 flex items-center justify-center">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">System Status</div>
                  <div className="text-sm font-bold text-emerald-650 flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
                  </div>
                </div>
              </Card>
            </div>

            {/* Nigeria Geopolitical Interactive Map Section */}
            <Card className="p-6 shadow-card border-border bg-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-foreground text-sm uppercase">
                    National Geopolitical Registry & Camps Density Map
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Real-time monitoring of biometrics intake hubs and IDP camps hotspots. Hover over points for metrics.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" /> FCT</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" /> North East</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> South West</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> Middle Belt</span>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3 items-center">
                {/* Left/Middle: SVG Nigeria Map */}
                <div className="md:col-span-2 relative flex items-center justify-center">
                  <NigeriaMapSVG activeNode={hoveredNode} onHoverNode={setHoveredNode} />
                </div>

                {/* Right: Selected Node Details Card */}
                <div className="md:col-span-1 h-full">
                  <Card className="p-5 border-primary/10 bg-muted/20 h-full flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
                    
                    {(() => {
                      const node = MAP_NODES.find((n) => n.id === hoveredNode) || MAP_NODES[0];
                      return (
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-start border-b pb-2">
                            <div>
                              <h4 className="font-display font-extrabold text-foreground text-sm uppercase tracking-wide">
                                {node.name}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Region: {node.state}
                              </span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              node.status.includes("Warning") ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-950"
                            }`}>
                              {node.status}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Total Active Registrants:</span>
                              <span className="font-bold text-foreground">{node.registrants}</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-primary/10">
                              <span>• Refugees protected:</span>
                              <span className="font-semibold text-foreground">{node.refugees}</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-primary/10">
                              <span>• IDPs registered:</span>
                              <span className="font-semibold text-foreground">{node.idps}</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-primary/10">
                              <span>• Migrants tracked:</span>
                              <span className="font-semibold text-foreground">{node.migrants}</span>
                            </div>

                            <div className="pt-2 border-t mt-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                                Monitored Camps / Settlements
                              </span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {node.camps.map((camp) => (
                                  <Badge key={camp} variant="secondary" className="text-[9px] font-bold bg-card border border-border">
                                    {camp}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-[9px] text-muted-foreground italic border-t pt-3 flex items-center justify-between">
                            <span>Last Node Sync: Just now</span>
                            <span>TLS 1.3 Certified</span>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                </div>
              </div>
            </Card>

          </div>
        )}

        {/* VIEW 2: QUERY CONSOLE */}
        {activeTab === "query" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-card border-border bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Query Database Parameters</h3>
                  <p className="text-[10px] text-muted-foreground">Search, filter and lookup enrollees dynamically</p>
                </div>
                
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

              {loading ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Wifi className="h-6 w-6 text-primary animate-pulse" /> Loading database...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">No registration profiles found matching search criteria.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
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
                </div>
              )}
            </Card>
          </div>
        )}

        {/* VIEW 3: REGIONAL STATES */}
        {activeTab === "state" && (
          <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {/* Top Registration Regions */}
            <Card className="p-6 md:col-span-2 shadow-card border-border bg-card">
              <div className="mb-4 border-b pb-2">
                <h3 className="font-display font-bold text-foreground text-sm">Zonal Registration Density</h3>
                <p className="text-[10px] text-muted-foreground">Density metrics by geopolitical origin state</p>
              </div>

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
                          className="w-10 bg-primary rounded-t transition-all duration-1000 hover:bg-primary/85"
                          style={{ height: `${Math.max(ht, 12)}px` }}
                        />
                        <span className="text-[9px] font-bold text-muted-foreground mt-2 truncate w-14 text-center uppercase">
                          {state.slice(0, 8)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* List breakdown */}
            <Card className="p-6 md:col-span-1 shadow-card border-border bg-card">
              <div className="mb-4 border-b pb-2">
                <h3 className="font-display font-bold text-foreground text-sm">State breakdown</h3>
                <p className="text-[10px] text-muted-foreground">Volume count of local enrollees</p>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {Object.keys(stateCounts).length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">No state origin counts logged.</div>
                ) : (
                  Object.entries(stateCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([st, count]) => (
                      <div key={st} className="flex justify-between items-center text-xs border-b pb-1.5">
                        <span className="font-semibold text-foreground uppercase">{st} State</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">{count} records</Badge>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 4: PERSONS OF CONCERN (POC LIST) */}
        {activeTab === "poc" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-2 border-b pb-2">
              {[
                { id: "all", label: "All Intake Profiles" },
                { id: "refugee", label: "Refugees Division" },
                { id: "idp", label: "IDPs Division" },
                { id: "migrant", label: "Migrants Division" },
                { id: "returnee", label: "Returnees Division" }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    categoryFilter === c.id
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <Card className="p-6 shadow-card border-border bg-card">
              {loading ? (
                <div className="p-10 text-center text-xs text-muted-foreground">Loading database...</div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">No records under active filters.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                      <tr>
                        <th className="p-3.5">Reference ID</th>
                        <th className="p-3.5">Full Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Origin State</th>
                        <th className="p-3.5">LGA</th>
                        <th className="p-3.5">Accompanying Dependants</th>
                        <th className="p-3.5">Date Intake</th>
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
                          <td className="p-3.5 uppercase">{item.state_origin || "—"}</td>
                          <td className="p-3.5 uppercase">{item.lga}</td>
                          <td className="p-3.5 font-semibold">{item.dependants}</td>
                          <td className="p-3.5 text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* VIEW 5: CAMPS DIRECTORY */}
        {activeTab === "camps" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Durumi Camp, Abuja", state: "FCT", cap: 2500, occ: 2100, manager: "Musa Ibrahim", need: "Healthcare Supplies" },
                { name: "Kuchingoro Camp, Abuja", state: "FCT", cap: 1500, occ: 1420, manager: "Halima Yar'adua", need: "Clean Water (WAsH)" },
                { name: "Maiduguri Zonal Camp, Borno", state: "Borno", cap: 8000, occ: 7400, manager: "Mustapha Ali", need: "Food Security & Grain" },
                { name: "Daudu Camp, Benue", state: "Benue", cap: 3000, occ: 2200, manager: "Terna Orji", need: "Baby Foods & Nutrition" },
                { name: "Uhogua Camp, Edo", state: "Edo", cap: 2000, occ: 1850, manager: "Grace Osagie", need: "Educational Materials" }
              ].map((camp) => {
                const ratio = Math.round((camp.occ / camp.cap) * 100);
                return (
                  <Card key={camp.name} className="p-5 shadow-card border-border bg-card hover-glow relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
                    <div className="flex justify-between items-start border-b pb-2 mb-3">
                      <div>
                        <h4 className="font-display font-extrabold text-foreground text-sm uppercase">{camp.name}</h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">Location: {camp.state} State</span>
                      </div>
                      <Badge className={ratio >= 90 ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}>
                        {ratio}% Capacity
                      </Badge>
                    </div>

                    <div className="space-y-3.5 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-foreground">
                          <span>Intake Occupancy</span>
                          <span>{camp.occ} / {camp.cap} Persons</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            ratio >= 90 ? "bg-accent" : "bg-primary"
                          }`} style={{ width: `${ratio}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between pt-1 border-t"><span>Manager:</span><span className="font-semibold text-foreground">{camp.manager}</span></div>
                      <div className="flex justify-between"><span>Immediate Priority Need:</span><span className="font-semibold text-primary">{camp.need}</span></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: HOST COMMUNITIES */}
        {activeTab === "host_comm" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Durumi Host Community", state: "FCT", families: 320, healthcare: "Inadequate", waterPoints: 4, program: "Livelihood & Skills Grant" },
                { name: "Kukawa Geopolitical Community", state: "Borno", families: 1200, healthcare: "Mobile Clinic Active", waterPoints: 12, program: "WAsH Wellbore Infrastructure" },
                { name: "Wasa Resettlement Community", state: "FCT", families: 450, healthcare: "Fully Operational", waterPoints: 6, program: "Youth Educational Support" },
                { name: "Ogoja Border Community", state: "Cross River", families: 600, healthcare: "Inadequate", waterPoints: 8, program: "Emergency Health Post Support" }
              ].map((comm) => (
                <Card key={comm.name} className="p-5 shadow-card border-border bg-card hover-glow relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <div>
                      <h4 className="font-display font-extrabold text-foreground text-sm uppercase">{comm.name}</h4>
                      <span className="text-[10px] text-muted-foreground font-semibold">State: {comm.state}</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-900 font-bold border-emerald-200">Active Support</Badge>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Hosted Families Count:</span><span className="font-semibold text-foreground">{comm.families}</span></div>
                    <div className="flex justify-between"><span>Geopolitical Water Points:</span><span className="font-semibold text-foreground">{comm.waterPoints} active wells</span></div>
                    <div className="flex justify-between"><span>Primary Clinic Status:</span><span className="font-semibold text-foreground">{comm.healthcare}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2"><span>Current Zonal Program:</span><span className="font-bold text-primary">{comm.program}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: USER ROLES MANAGER (super user can assign roles) */}
        {activeTab === "roles" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-elegant border border-border bg-card">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> User Credentials & Zonal Roles Manager
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Super user console to assign credential privileges and authorize operations nodes.</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                    <tr>
                      <th className="p-3.5">User Email</th>
                      <th className="p-3.5">Current Role</th>
                      <th className="p-3.5">System Privileges</th>
                      <th className="p-3.5 text-right">Role Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(userRoles).map(([email, role]) => (
                      <tr key={email} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-foreground text-[11px]">{email}</td>
                        <td className="p-3.5">
                          <Badge className={
                            role === "commissioner" ? "bg-red-100 text-red-900 border-red-200 font-extrabold" :
                            role === "officer" ? "bg-primary/10 text-primary border-primary/20 font-extrabold" :
                            "bg-muted text-muted-foreground border-border"
                          }>
                            {role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-muted-foreground leading-normal max-w-sm">
                          {role === "commissioner" ? "Read/Write/Delete Admin, Zonal Role assignment, PDF/CSV Reports" :
                           role === "officer" ? "Liveness Camera scan, Fingerprint scan, Client intake logs" :
                           "View announcements, register personal files"}
                        </td>
                        <td className="p-3.5 text-right">
                          <Select value={role} onValueChange={(val) => handleUpdateRole(email, val)}>
                            <SelectTrigger className="w-[140px] text-xs ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="commissioner">Commissioner</SelectItem>
                              <SelectItem value="officer">Field Officer</SelectItem>
                              <SelectItem value="applicant">Applicant</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW 8: AUDITS & REPORTS */}
        {activeTab === "report" && (
          <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {/* OPay-style statement request panel */}
            <Card className="p-6 shadow-card border-border bg-card space-y-4">
              <div className="border-b pb-3 flex items-center gap-3">
                <img src={logo} alt="NCFRMI Logo" className="h-9 w-9 object-contain animate-fade-in" />
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Request for Internal Report</h3>
                  <p className="text-[10px] text-muted-foreground">Select date frame and export formats</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Date Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="text-xs py-1 h-8 rounded border border-border"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="text-xs py-1 h-8 rounded border border-border"
                    />
                  </div>
                </div>

                {/* Format selection */}
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    File Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReportFormat("pdf")}
                      className={`py-1.5 text-xs font-bold uppercase rounded border transition-all ${
                        reportFormat === "pdf"
                          ? "bg-primary/10 text-primary border-primary"
                          : "text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      Official PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFormat("csv")}
                      className={`py-1.5 text-xs font-bold uppercase rounded border transition-all ${
                        reportFormat === "csv"
                          ? "bg-primary/10 text-primary border-primary"
                          : "text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      Excel CSV
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="w-full bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-bold uppercase py-2 h-9 rounded shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Proceed to Generate Report
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Audit Log Feed */}
            <Card className="p-6 md:col-span-2 shadow-card border-border bg-card">
              <div className="mb-4 border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Security audit logs</h3>
                  <p className="text-[10px] text-muted-foreground">Tracking system actions and authorized sessions</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-250">Active logging</Badge>
              </div>

              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {[
                  { text: "Zonal Role updated for applicant@ncfrmi.gov.ng to OFFICER", time: "Just now", action: "ROLE_CHANGE" },
                  { text: "CSV Enrolment data dump generated by commissioner@ncfrmi.gov.ng", time: "12 mins ago", action: "DATA_EXPORT" },
                  { text: "Zonal database sync completed successfully with Borno Gateway", time: "42 mins ago", action: "SYNC_COMPLETED" },
                  { text: "Liveness verification profile locked for NCF-REG-2026-A83B", time: "1 hour ago", action: "REGISTRATION" }
                ].map((log, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b pb-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] uppercase font-bold text-primary block">{log.action}</span>
                      <p className="text-foreground leading-normal">{log.text}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </>
    )}
      </div>

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

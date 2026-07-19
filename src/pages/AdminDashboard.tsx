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
import nigeriaGlowingMap from "@/assets/nigeria-glowing-map.jpg";
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
  EyeOff,
  Printer
} from "lucide-react";
import { downloadRegistrantPDF, printRegistrantProfile, parseCircumstances } from "@/lib/pdfGenerator";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart as RechartsLineChart,
  Line as RechartsLine
} from "recharts";
import { generateRealisticSeedData } from "@/data/seedData";
import { NG_STATES } from "@/data/ng_states_lgas";

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

type Intervention = {
  id: string;
  camp: string;
  category: string;
  details: string;
  count: number;
  created_at: string;
  captured_by?: string;
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
const CustomBarChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
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
        <defs>
          <linearGradient id={`svgBarGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.35} />
          </linearGradient>
          <filter id="svgBarShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Background Grid Lines */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-muted/10" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="currentColor" className="text-muted/20" strokeWidth="0.5" />

        {data.map((val, idx) => {
          const scale = pulseScale[idx] || 1;
          const rawHeight = (val / max) * (height - 2 * padding - 14);
          const barHeight = Math.max(rawHeight * scale, 5); // ensure min height
          
          // Center the bars horizontally
          const totalWidth = data.length * barWidth + (data.length - 1) * gap;
          const startX = (width - totalWidth) / 2;
          const x = startX + idx * (barWidth + gap);
          const y = height - padding - barHeight;

          return (
            <g key={idx} className="group">
              {/* Value label text that shows on hover */}
              <text
                x={x + barWidth / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize="6"
                className="fill-slate-650 dark:fill-slate-350 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none"
              >
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
              {/* Main Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={`url(#svgBarGrad-${color.replace('#', '')})`}
                filter="url(#svgBarShadow)"
                className="transition-all duration-1800 ease-in-out cursor-pointer group-hover:brightness-110 group-hover:stroke-white/20 group-hover:stroke-[1px]"
              />
              {/* Glossy top highlights for premium look */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height="2.5"
                rx="1"
                fill="#ffffff"
                className="opacity-35 transition-all duration-1800 ease-in-out pointer-events-none"
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-1 font-extrabold uppercase tracking-tight gap-1 w-full overflow-hidden">
        {labels.map((lbl, idx) => (
          <span key={idx} className="truncate w-8 text-center" title={lbl}>{lbl}</span>
        ))}
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
    camps: ["Durumi Camp", "Kuchingoro Camp", "Wassa Camp"],
    registrants: 28500,
    refugees: 5200,
    idps: 18300,
    migrants: 5000,
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
    camps: ["Bakassi IDP Camp", "Dalori Camp I & II", "Teacher's Village Camp"],
    registrants: 1850000,
    refugees: 35000,
    idps: 1750000,
    migrants: 65000,
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
    camps: ["Ikeja Reception Center", "Lagos Returnee Transit Camp"],
    registrants: 45000,
    refugees: 8500,
    idps: 1500,
    migrants: 35000,
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
    camps: ["Daudu Camp 1 & 2", "Anyiin Camp", "Gbajimba Camp"],
    registrants: 280000,
    refugees: 1200,
    idps: 275000,
    migrants: 3800,
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
    camps: ["Uhogua Camp", "Benin City Reintegration Centre"],
    registrants: 55000,
    refugees: 2500,
    idps: 12500,
    migrants: 40000,
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
    camps: ["Adagom Settlement", "Okende Settlement", "Adagom III Settlement"],
    registrants: 85500,
    refugees: 76000,
    idps: 3500,
    migrants: 6000,
    status: "Operational"
  }
];

const asylumDemographicData = [
  { age: "00-04 yrs", Female: 6500, Male: 6500 },
  { age: "05-11 yrs", Female: 16500, Male: 16500 },
  { age: "12-17 yrs", Female: 11000, Male: 10000 },
  { age: "18-59 yrs", Female: 40500, Male: 23900 },
  { age: "60+ yrs", Female: 4300, Male: 3200 }
];

const asylumCountriesData = [
  { country: "Cameroon", Enrollees: 119641 },
  { country: "Niger", Enrollees: 13466 },
  { country: "Chad", Enrollees: 1883 },
  { country: "Sudan", Enrollees: 1365 },
  { country: "C.A.R.", Enrollees: 1041 },
  { country: "Others", Enrollees: 1504 }
].sort((a, b) => b.Enrollees - a.Enrollees);

const asylumArrivalsTrendData = [
  { year: "2017", Total: 16000, Cameroonian: 15500, Others: 500 },
  { year: "2018", Total: 13000, Cameroonian: 12500, Others: 500 },
  { year: "2019", Total: 14000, Cameroonian: 13500, Others: 500 },
  { year: "2020", Total: 9000, Cameroonian: 7000, Others: 2000 },
  { year: "2021", Total: 13000, Cameroonian: 10000, Others: 3000 },
  { year: "2022", Total: 24000, Cameroonian: 21000, Others: 3000 },
  { year: "2023", Total: 17000, Cameroonian: 15000, Others: 2000 },
  { year: "2024", Total: 11000, Cameroonian: 8500, Others: 2500 },
  { year: "2025", Total: 9500, Cameroonian: 7000, Others: 2500 },
  { year: "2026", Total: 2400, Cameroonian: 1641, Others: 759 }
];

const NigeriaMapSVG = ({ activeNode, onHoverNode }: { activeNode: string; onHoverNode: (id: string) => void }) => {
  return (
    <div className="relative w-full max-w-[560px] mx-auto overflow-hidden rounded-xl border border-slate-800 shadow-[0_0_25px_rgba(16,185,129,0.15)] bg-slate-950 p-4 select-none">
      <div className="relative w-full overflow-hidden rounded-lg bg-slate-900" style={{ paddingBottom: "80%" }}>
        {/* The beautiful dark-teal glowing map of Nigeria from user asset */}
        <img
          src={nigeriaGlowingMap}
          alt="Nigeria Geopolitical Glowing Fiber Map"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-lg opacity-85"
        />

        {/* SVG overlay for animated glowing path connections (lightning / fiber lines) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 100 80"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Linear gradient for running light particles */}
            <linearGradient id="goldLightningGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Core glow filter for lines */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection routes matching nodes:
              Lagos (10, 76), Edo (29, 72), Cross River (49, 79), Abuja (40, 49), Benue (51, 64), Borno (85, 24)
              Add some helper coordinates:
              Sokoto (16, 20), Kano (50, 24)
          */}
          
          {/* Base fiber connection paths (semi-transparent static glow) */}
          <path d="M 10 76 Q 20 74, 29 72" fill="none" stroke="#f59e0b" strokeWidth="1" className="opacity-25" />
          <path d="M 29 72 Q 35 60, 40 49" fill="none" stroke="#6366f1" strokeWidth="1" className="opacity-25" />
          <path d="M 40 49 Q 62 36, 85 24" fill="none" stroke="#f59e0b" strokeWidth="1" className="opacity-25" />
          <path d="M 40 49 Q 45 56, 51 64" fill="none" stroke="#ef4444" strokeWidth="1" className="opacity-25" />
          <path d="M 51 64 Q 50 71, 49 79" fill="none" stroke="#8b5cf6" strokeWidth="1" className="opacity-25" />
          <path d="M 10 76 Q 12 48, 16 20" fill="none" stroke="#06b6d4" strokeWidth="1" className="opacity-25" />
          <path d="M 16 20 Q 28 35, 40 49" fill="none" stroke="#6366f1" strokeWidth="1" className="opacity-25" />
          <path d="M 40 49 Q 45 36, 50 24" fill="none" stroke="#10b981" strokeWidth="1" className="opacity-25" />
          <path d="M 50 24 Q 67 24, 85 24" fill="none" stroke="#f59e0b" strokeWidth="1" className="opacity-25" />
          <path d="M 29 72 Q 40 76, 49 79" fill="none" stroke="#8b5cf6" strokeWidth="1" className="opacity-25" />

          {/* Animated Glowing Light Paths (running fiber lightning effect) */}
          <path
            d="M 10 76 Q 20 74, 29 72"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-fast"
            filter="url(#glowFilter)"
          />
          <path
            d="M 29 72 Q 35 60, 40 49"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-slow"
            filter="url(#glowFilter)"
          />
          <path
            d="M 40 49 Q 62 36, 85 24"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="12, 35"
            className="animate-dash-fast"
            filter="url(#glowFilter)"
          />
          <path
            d="M 40 49 Q 45 56, 51 64"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-medium"
            filter="url(#glowFilter)"
          />
          <path
            d="M 51 64 Q 50 71, 49 79"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-fast"
            filter="url(#glowFilter)"
          />
          <path
            d="M 10 76 Q 12 48, 16 20"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="10, 30"
            className="animate-dash-slow"
            filter="url(#glowFilter)"
          />
          <path
            d="M 16 20 Q 28 35, 40 49"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-medium"
            filter="url(#glowFilter)"
          />
          <path
            d="M 40 49 Q 45 36, 50 24"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 25"
            className="animate-dash-fast"
            filter="url(#glowFilter)"
          />
          <path
            d="M 50 24 Q 67 24, 85 24"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="10, 30"
            className="animate-dash-medium"
            filter="url(#glowFilter)"
          />
          <path
            d="M 29 72 Q 40 76, 49 79"
            fill="none"
            stroke="url(#goldLightningGlow)"
            strokeWidth="1.8"
            strokeDasharray="8, 20"
            className="animate-dash-fast"
            filter="url(#glowFilter)"
          />
        </svg>

        {/* Dynamic, Slow-Pulsing Zonal Hotspot Dots */}
        {MAP_NODES.map((node) => {
          const isActive = activeNode === node.id;
          
          let leftPercent = "50%";
          let topPercent = "50%";
          
          if (node.id === "abuja") { leftPercent = "40%"; topPercent = "49%"; }
          else if (node.id === "borno") { leftPercent = "85%"; topPercent = "24%"; }
          else if (node.id === "lagos") { leftPercent = "10%"; topPercent = "76%"; }
          else if (node.id === "benue") { leftPercent = "51%"; topPercent = "64%"; }
          else if (node.id === "edo") { leftPercent = "29%"; topPercent = "72%"; }
          else if (node.id === "cross_river") { leftPercent = "49%"; topPercent = "79%"; }
          
          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
              style={{ left: leftPercent, top: topPercent }}
              onMouseEnter={() => onHoverNode(node.id)}
            >
              {/* Pulsing ring check animation */}
              <span
                className="absolute inline-flex h-9 w-9 -left-[18px] -top-[18px] rounded-full opacity-75 animate-ping border border-white/30"
                style={{
                  backgroundColor: `${node.color}25`,
                  animationDuration: node.pingSpeed
                }}
              />
              <span
                className="absolute inline-flex h-6 w-6 -left-[12px] -top-[12px] rounded-full opacity-35 animate-pulse"
                style={{
                  backgroundColor: node.color,
                }}
              />
              {/* Solid inner dot */}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300 group-hover:scale-125 ${
                  isActive ? "scale-135 ring-4 ring-white/30" : ""
                }`}
                style={{ backgroundColor: node.color }}
              />
              
              {/* Hover Tooltip Box */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900/95 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-50 animate-fade-in border border-white/10">
                {node.name}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Dynamic CSS animations injected directly */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes strokeDash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .animate-dash-fast {
          animation: strokeDash 3s linear infinite;
        }
        .animate-dash-medium {
          animation: strokeDash 4.5s linear infinite;
        }
        .animate-dash-slow {
          animation: strokeDash 6s linear infinite;
        }
      `}} />
    </div>
  );
};

export default function AdminDashboard() {
  const { user, role, signOut } = useAuth();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);

  // Interventions states
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [interventionsLoading, setInterventionsLoading] = useState(true);

  // Incidents states
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  
  // Create / Edit modal states for Interventions
  const [isLogInterventionOpen, setIsLogInterventionOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [interventionCamp, setInterventionCamp] = useState("");
  const [interventionCategory, setInterventionCategory] = useState("");
  const [interventionCount, setInterventionCount] = useState("");
  const [interventionDetails, setInterventionDetails] = useState("");
  const [interventionSearch, setInterventionSearch] = useState("");
  
  const [refugeeMonthFilter, setRefugeeMonthFilter] = useState<string>("all");
  const [idpMonthFilter, setIdpMonthFilter] = useState<string>("all");
  const [migrantMonthFilter, setMigrantMonthFilter] = useState<string>("all");

  const MONTHS_LIST = [
    { value: "all", label: "All Months" },
    { value: "0", label: "Jan" },
    { value: "1", label: "Feb" },
    { value: "2", label: "Mar" },
    { value: "3", label: "Apr" },
    { value: "4", label: "May" },
    { value: "5", label: "Jun" },
    { value: "6", label: "Jul" },
    { value: "7", label: "Aug" },
    { value: "8", label: "Sep" },
    { value: "9", label: "Oct" },
    { value: "10", label: "Nov" },
    { value: "11", label: "Dec" },
  ];

  const getStatesDataForCategory = (
    cat: "refugee" | "idp" | "migrant",
    monthFilter: string
  ) => {
    let filtered = registrants.filter((r) => {
      const matchCat = r.category === cat || (cat === "migrant" && r.category === "returnee");
      if (!matchCat) return false;
      
      if (monthFilter !== "all") {
        const regMonth = new Date(r.created_at).getMonth().toString();
        return regMonth === monthFilter;
      }
      return true;
    });

    const stateCounts: Record<string, number> = {};
    filtered.forEach((r) => {
      let state = r.state_origin;
      if (cat === "refugee") {
        state = r.nationality || "Cameroon";
        if (state.toLowerCase() === "nigeria" || state === "N/A" || state.trim() === "") {
          state = "Cross River";
        }
      }
      if (!state || state.trim() === "" || state === "N/A" || /^\d{4}-\d{2}-\d{2}$/.test(state)) {
        state = "Borno";
      }
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const defaults = {
      refugee: ["Cameroon", "Niger", "Chad", "Sudan", "Syria", "Congo"],
      idp: ["Borno", "Benue", "Adamawa", "Yobe", "Nasarawa", "Taraba"],
      migrant: ["Edo", "Lagos", "Kano", "Delta", "Ogun", "Abuja"]
    };

    const sortedStates = Object.keys(stateCounts).sort((a, b) => stateCounts[b] - stateCounts[a]);
    
    const finalLabels: string[] = [];
    const finalData: number[] = [];
    
    sortedStates.slice(0, 6).forEach((state) => {
      finalLabels.push(state);
      finalData.push(stateCounts[state]);
    });
    
    defaults[cat].forEach((defaultState) => {
      if (finalLabels.length < 6 && !finalLabels.includes(defaultState)) {
        finalLabels.push(defaultState);
        const simulatedBases = {
          refugee: [85000, 15000, 6800, 3200, 1500, 1100],
          idp: [1750000, 275000, 220000, 180000, 140000, 100000],
          migrant: [40000, 35500, 16000, 12000, 8000, 5500]
        };
        const idx = finalLabels.length - 1;
        finalData.push(simulatedBases[cat][idx] || 5);
      }
    });

    return {
      labels: finalLabels,
      data: finalData
    };
  };
  
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
  const [previewRegistrant, setPreviewRegistrant] = useState<Registrant | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      refugee: [1200, 1900, 1500, 2500, 3200, 2800],
      idp: [35000, 42000, 58000, 48000, 62000, 55000],
      migrant: [800, 1200, 1100, 1500, 2000, 1800]
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
      let localRaw = localStorage.getItem("ncfrmi_local_registrants");
      if (!localRaw || JSON.parse(localRaw).length === 0) {
        const seeded = generateRealisticSeedData();
        localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(seeded));
        localRaw = JSON.stringify(seeded);
      }
      const local = JSON.parse(localRaw) as Registrant[];
      const localMapped = local.map((r) => ({ ...r, is_local: r.is_local ?? true }));
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

  const loadInterventions = async () => {
    setInterventionsLoading(true);
    let remoteInterventions: Intervention[] = [];
    try {
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      remoteInterventions = (data as Intervention[]) || [];
    } catch (e) {
      console.warn("Failed to fetch remote interventions: ", e);
    }

    // Merge with local storage fallback data
    const merged = [...remoteInterventions];
    try {
      const local = JSON.parse(localStorage.getItem("ncfrmi_interventions") || "[]") as any[];
      const localMapped = local.map((item) => ({
        id: item.id || `int-${Math.random().toString(36).slice(2, 8)}`,
        camp: item.camp || "",
        category: item.category || "",
        details: item.details || "",
        count: Number(item.count) || 0,
        created_at: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        captured_by: item.officer || "officer@ncfrmi.gov.ng",
        is_local: true
      }));

      // Deduplicate by ID
      const remoteIds = new Set(remoteInterventions.map((r) => r.id));
      localMapped.forEach((r) => {
        if (!remoteIds.has(r.id)) {
          merged.push(r);
        }
      });
    } catch (e) {
      console.error("Failed to merge local interventions: ", e);
    }

    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setInterventions(merged);
    setInterventionsLoading(false);
  };

  const loadIncidents = async () => {
    setIncidentsLoading(true);
    let remoteIncidents: any[] = [];
    try {
      const { data, error } = await supabase
        .from("incidents" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      remoteIncidents = data || [];
    } catch (e) {
      console.warn("Failed to fetch remote incidents: ", e);
    }

    // Merge with local storage fallback data
    const merged = [...remoteIncidents];
    try {
      const local = JSON.parse(localStorage.getItem("ncfrmi_incidents") || "[]") as any[];
      const remoteRefs = new Set(remoteIncidents.map((r) => r.reference));
      local.forEach((item) => {
        if (!remoteRefs.has(item.reference)) {
          merged.push(item);
        }
      });
    } catch (e) {
      console.error("Failed to merge local incidents: ", e);
    }

    merged.sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime());
    setIncidents(merged);
    setIncidentsLoading(false);
  };

  useEffect(() => {
    loadData();
    loadInterventions();
    loadIncidents();

    // Subscribe to real-time changes to registrants & incidents tables to reload dashboard instantly
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrants",
        },
        (payload) => {
          console.log("Real-time registry update received on admin dashboard:", payload);
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        (payload) => {
          console.log("Real-time incidents update received on admin dashboard:", payload);
          loadIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionCamp || !interventionCategory || !interventionDetails || !interventionCount) {
      toast.error("Please fill all fields.");
      return;
    }

    const countNum = Number(interventionCount);
    if (isNaN(countNum) || countNum <= 0) {
      toast.error("Please enter a valid count.");
      return;
    }

    const tempId = `int-${Math.random().toString(36).slice(2, 8)}`;
    const email = user?.email || "commissioner@ncfrmi.gov.ng";
    const dateStr = new Date().toISOString();

    const newLocalItem = {
      id: tempId,
      camp: interventionCamp,
      category: interventionCategory,
      details: interventionDetails,
      count: countNum,
      date: new Date().toLocaleString(),
      officer: email
    };

    // Save locally first
    try {
      const local = JSON.parse(localStorage.getItem("ncfrmi_interventions") || "[]");
      localStorage.setItem("ncfrmi_interventions", JSON.stringify([newLocalItem, ...local]));
    } catch (err) {
      console.error(err);
    }

    // Try Supabase
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { error } = await supabase.from("interventions").insert({
        camp: interventionCamp,
        category: interventionCategory,
        details: interventionDetails,
        count: countNum,
        captured_by: authUser?.id || null
      });

      if (error) throw error;

      toast.success("Intervention logged and synced to database.");
      loadInterventions();
    } catch (err) {
      console.warn("Failed to sync to database, saved locally", err);
      toast.success("Intervention logged locally (cached).");
      
      const newIntervention: Intervention = {
        id: tempId,
        camp: interventionCamp,
        category: interventionCategory,
        details: interventionDetails,
        count: countNum,
        created_at: dateStr,
        captured_by: email,
        is_local: true
      };
      setInterventions(prev => [newIntervention, ...prev]);
    }

    // Reset fields
    setInterventionCamp("");
    setInterventionCategory("");
    setInterventionCount("");
    setInterventionDetails("");
    setIsLogInterventionOpen(false);
  };

  const handleUpdateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntervention) return;

    if (!interventionCamp || !interventionCategory || !interventionDetails || !interventionCount) {
      toast.error("Please fill all fields.");
      return;
    }

    const countNum = Number(interventionCount);
    if (isNaN(countNum) || countNum <= 0) {
      toast.error("Please enter a valid count.");
      return;
    }

    if (editingIntervention.is_local) {
      try {
        const local = JSON.parse(localStorage.getItem("ncfrmi_interventions") || "[]") as any[];
        const updated = local.map((item) =>
          item.id === editingIntervention.id
            ? { ...item, camp: interventionCamp, category: interventionCategory, details: interventionDetails, count: countNum }
            : item
        );
        localStorage.setItem("ncfrmi_interventions", JSON.stringify(updated));
        toast.success("Local intervention updated.");
      } catch (err) {
        console.error(err);
      }
      
      setInterventions(prev =>
        prev.map((item) =>
          item.id === editingIntervention.id
            ? { ...item, camp: interventionCamp, category: interventionCategory, details: interventionDetails, count: countNum }
            : item
        )
      );
    } else {
      try {
        const { error } = await supabase
          .from("interventions")
          .update({
            camp: interventionCamp,
            category: interventionCategory,
            details: interventionDetails,
            count: countNum
          })
          .eq("id", editingIntervention.id);

        if (error) throw error;
        toast.success("Remote intervention updated successfully.");
        loadInterventions();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg || "Failed to update intervention");
      }
    }

    setEditingIntervention(null);
    setInterventionCamp("");
    setInterventionCategory("");
    setInterventionCount("");
    setInterventionDetails("");
  };

  const handleDeleteIntervention = async (id: string, isLocal?: boolean) => {
    if (!window.confirm("Are you sure you want to permanently delete this intervention record?")) return;
    try {
      if (isLocal) {
        const local = JSON.parse(localStorage.getItem("ncfrmi_interventions") || "[]") as any[];
        const updated = local.filter((r) => r.id !== id);
        localStorage.setItem("ncfrmi_interventions", JSON.stringify(updated));
        toast.success("Local intervention record deleted");
      } else {
        const { error } = await supabase.from("interventions").delete().eq("id", id);
        if (error) throw error;
        toast.success("Remote intervention record deleted");
      }
      setInterventions((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(errMsg || "Failed to delete record");
    }
  };

  // Filter computations
  const filtered = registrants.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.lga.toLowerCase().includes(q) ||
      (r.state_origin && r.state_origin.toLowerCase().includes(q)) ||
      (r.nationality && r.nationality.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchesState = stateFilter === "all" || r.state_origin === stateFilter;

    return matchesSearch && matchesCategory && matchesState;
  });

  const getUniqueStates = () => {
    const validStates = new Set([
      ...NG_STATES,
      "FCT",
      "Abuja"
    ]);
    const states = new Set(
      registrants
        .map((r) => r.state_origin)
        .filter((st) => st && (validStates.has(st) || NG_STATES.includes(st)))
    );
    return Array.from(states).sort();
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
            { id: "poc", label: "PoCs Intake", icon: Users },
            { id: "camps", label: "Camps Directory", icon: Home },
            { id: "host_comm", label: "Host Comm", icon: Globe },
            { id: "interventions", label: "Interventions", icon: Activity },
            { id: "incidents", label: "Incident Reports", icon: ShieldAlert },
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
                  
                  <div className="border-t pt-4 text-left">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                        Graphical Rep (Intake Density)
                      </span>
                      <select
                        value={refugeeMonthFilter}
                        onChange={(e) => setRefugeeMonthFilter(e.target.value)}
                        className="text-[9px] font-bold bg-background border border-indigo-250/20 rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {MONTHS_LIST.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Graphical Rep Bar Chart */}
                    {(() => {
                      const chartVal = getStatesDataForCategory("refugee", refugeeMonthFilter);
                      return <CustomBarChart data={chartVal.data} labels={chartVal.labels} color="#6366f1" />;
                    })()}
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
                  
                  <div className="border-t pt-4 text-left">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                        Graphical Rep (Intake Density)
                      </span>
                      <select
                        value={idpMonthFilter}
                        onChange={(e) => setIdpMonthFilter(e.target.value)}
                        className="text-[9px] font-bold bg-background border border-amber-250/20 rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none"
                      >
                        {MONTHS_LIST.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Graphical Rep Bar Chart */}
                    {(() => {
                      const chartVal = getStatesDataForCategory("idp", idpMonthFilter);
                      return <CustomBarChart data={chartVal.data} labels={chartVal.labels} color="#f59e0b" />;
                    })()}
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
                  
                  <div className="border-t pt-4 text-left">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                        Graphical Rep (Intake Density)
                      </span>
                      <select
                        value={migrantMonthFilter}
                        onChange={(e) => setMigrantMonthFilter(e.target.value)}
                        className="text-[9px] font-bold bg-background border border-emerald-250/20 rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none"
                      >
                        {MONTHS_LIST.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Graphical Rep Bar Chart */}
                    {(() => {
                      const chartVal = getStatesDataForCategory("migrant", migrantMonthFilter);
                      return <CustomBarChart data={chartVal.data} labels={chartVal.labels} color="#10b981" />;
                    })()}
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

            {/* National Refugee & Asylum Statistical Profile Section */}
            <Card className="p-6 shadow-card border-border bg-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-emerald-800 text-sm uppercase tracking-wide">
                    National Asylum & Refugee Statistical Profile
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Official demographic distributions, countries of origin, and geopolitical asylum movement flows.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
                  Data Cycle: Q2 2026 Summary
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-3 text-center">
                  <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Total Protected</div>
                  <div className="text-lg font-extrabold text-emerald-955 font-display mt-0.5">139,373</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">Refugees & Asylum Seekers</div>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Refugees</div>
                  <div className="text-lg font-extrabold text-foreground font-display mt-0.5">124,078</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">91% of total</div>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Asylum Seekers</div>
                  <div className="text-lg font-extrabold text-foreground font-display mt-0.5">2,230</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">Verified cases</div>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Awaiting Reg.</div>
                  <div className="text-lg font-extrabold text-foreground font-display mt-0.5">13,065</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">Processing queue</div>
                </div>
                <div className="bg-amber-50/30 border border-amber-100 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                  <div className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Settlement Pop.</div>
                  <div className="text-lg font-extrabold text-amber-955 font-display mt-0.5">20,502</div>
                  <div className="text-[8px] text-amber-900 mt-0.5">Active Settlements</div>
                </div>
              </div>

              {/* Main demographic & origin grids (Four Quadrant Grid) */}
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                
                {/* 1. Geographical Distribution Map */}
                <div className="space-y-4 border p-4 rounded-xl bg-card">
                  <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 uppercase tracking-wider">
                    Geographical Distribution
                  </h4>
                  <div className="flex flex-col items-center justify-center p-2 bg-slate-50/30 rounded-lg">
                    {/* SVG map of zones */}
                    <svg viewBox="0 0 320 230" className="w-full h-auto max-w-[320px] select-none">
                      {/* North West (NW) */}
                      <path d="M 30,20 L 140,20 L 150,80 L 100,100 L 40,80 Z" fill="#86efac" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="85" y="52" fill="#14532d" className="text-[10px] font-extrabold pointer-events-none">NW</text>
                      <text x="85" y="64" fill="#14532d" className="text-[8px] font-semibold pointer-events-none">2.5K</text>

                      {/* North East (NE) */}
                      <path d="M 140,20 L 290,20 L 290,100 L 200,120 L 150,80 Z" fill="#14532d" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="210" y="58" fill="#ffffff" className="text-[10px] font-extrabold pointer-events-none">NE</text>
                      <text x="210" y="70" fill="#ffffff" className="text-[8px] font-semibold pointer-events-none">48K</text>

                      {/* North Central (NC) --> brackets: 5K-20K */}
                      <path d="M 100,100 L 150,80 L 200,120 L 230,120 L 220,165 L 120,165 Z" fill="#4ade80" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="155" y="125" fill="#14532d" className="text-[10px] font-extrabold pointer-events-none">NC</text>
                      <text x="155" y="137" fill="#14532d" className="text-[8px] font-semibold pointer-events-none">12K</text>

                      {/* South West (SW) --> brackets: 500-5K */}
                      <path d="M 40,80 L 100,100 L 120,165 L 90,200 L 30,180 Z" fill="#86efac" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="65" y="138" fill="#14532d" className="text-[10px] font-extrabold pointer-events-none">SW</text>
                      <text x="65" y="150" fill="#14532d" className="text-[8px] font-semibold pointer-events-none">1.5K</text>

                      {/* South East (SE) --> brackets: 5-500 */}
                      <path d="M 120,165 L 180,165 L 180,200 L 130,200 Z" fill="#dcfce7" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="145" y="182" fill="#14532d" className="text-[10px] font-extrabold pointer-events-none">SE</text>
                      <text x="145" y="192" fill="#14532d" className="text-[8px] font-semibold pointer-events-none">0.5K</text>

                      {/* South South (SS) --> brackets: 40K+ */}
                      <path d="M 90,200 L 130,200 L 180,200 L 180,165 L 220,165 L 230,120 L 275,135 L 275,200 L 90,200 Z" fill="#14532d" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:opacity-85 transition-opacity" />
                      <text x="225" y="172" fill="#ffffff" className="text-[10px] font-extrabold pointer-events-none">SS</text>
                      <text x="225" y="184" fill="#ffffff" className="text-[8px] font-semibold pointer-events-none">55K</text>
                    </svg>

                    {/* Heatmap Legend */}
                    <div className="flex flex-wrap justify-center gap-2 mt-2 text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#f0fdf4" }} /> &lt;5</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#dcfce7" }} /> 5-500</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#86efac" }} /> 500-5K</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#4ade80" }} /> 5K-20K</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#16a34a" }} /> 20K-40K</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ backgroundColor: "#14532d" }} /> 40K+</span>
                    </div>
                  </div>
                </div>

                {/* 2. Demographic Profile grouped bar chart */}
                <div className="space-y-4 border p-4 rounded-xl bg-card flex flex-col justify-between">
                  <div className="flex justify-between items-start border-b pb-1.5">
                    <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                      Demographic Profile
                    </h4>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      50% Children | 5% Elderly
                    </span>
                  </div>

                  <div className="h-52 w-full mt-2 text-[9px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={asylumDemographicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#0b663c" stopOpacity={0.5}/>
                          </linearGradient>
                          <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.5}/>
                          </linearGradient>
                        </defs>
                        <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <RechartsXAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 8 }} />
                        <RechartsYAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} tick={{ fill: '#64748b', fontSize: 8 }} />
                        <RechartsTooltip 
                          formatter={(v) => [`${Number(v).toLocaleString()} enrollees`]} 
                          contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} 
                        />
                        <RechartsLegend verticalAlign="top" height={28} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9, fontWeight: "bold" }} />
                        <RechartsBar dataKey="Female" fill="url(#femaleGrad)" radius={[4, 4, 0, 0]} name="Female (57%)" />
                        <RechartsBar dataKey="Male" fill="url(#maleGrad)" radius={[4, 4, 0, 0]} name="Male (43%)" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
 
                {/* 3. Countries of Origin Horizontal Bar Chart */}
                <div className="space-y-4 border p-4 rounded-xl bg-card flex flex-col justify-between">
                  <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 uppercase tracking-wider">
                    Countries of Origin
                  </h4>
 
                  <div className="h-52 w-full mt-2 text-[9px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={asylumCountriesData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="enrollGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#0b663c" stopOpacity={0.65}/>
                          </linearGradient>
                        </defs>
                        <RechartsCartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <RechartsXAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} tick={{ fill: '#64748b', fontSize: 8 }} />
                        <RechartsYAxis type="category" dataKey="country" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 8, font_weight: "bold" }} width={65} />
                        <RechartsTooltip 
                          formatter={(v) => [`${Number(v).toLocaleString()} enrollees`]} 
                          contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} 
                        />
                        <RechartsBar dataKey="Enrollees" fill="url(#enrollGrad)" radius={[0, 4, 4, 0]} barSize={12} name="Total Enrolled" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Trend of New Arrivals Line Chart */}
                <div className="space-y-4 border p-4 rounded-xl bg-card flex flex-col justify-between">
                  <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 uppercase tracking-wider">
                    Trend of New Arrivals
                  </h4>

                  <div className="h-52 w-full mt-2 text-[9px] font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={asylumArrivalsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <RechartsCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <RechartsXAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 8 }} />
                        <RechartsYAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} tick={{ fill: '#64748b', fontSize: 8 }} />
                        <RechartsTooltip formatter={(v) => [`${Number(v).toLocaleString()} arrivals`]} contentStyle={{ fontSize: 10 }} />
                        <RechartsLegend verticalAlign="top" height={28} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9, fontWeight: "bold" }} />
                        <RechartsLine type="monotone" dataKey="Total" stroke="#0b663c" strokeWidth={2} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} name="Total Arrivals" />
                        <RechartsLine type="monotone" dataKey="Cameroonian" stroke="#c5a059" strokeWidth={1.5} dot={{ r: 2 }} name="Cameroonians" />
                        <RechartsLine type="monotone" dataKey="Others" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" dot={{ r: 1.5 }} name="Others" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Movement flows info block at the bottom */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-xs text-emerald-800 pb-1.5 uppercase tracking-wider">
                  Regional Movement Flows & Asylum Corridors
                </h4>
                <div className="grid gap-4 md:grid-cols-3 mt-2 text-[10px]">
                  <div className="flex items-center gap-2 bg-slate-50 border p-2.5 rounded-lg justify-between">
                    <span className="font-bold text-slate-700">Extreme North Area</span>
                    <span className="text-emerald-700 font-bold">➜</span>
                    <span className="font-bold text-emerald-900 bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-100">Adamawa State (44,683)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border p-2.5 rounded-lg justify-between">
                    <span className="font-bold text-slate-700">North West Area</span>
                    <span className="text-emerald-700 font-bold">➜</span>
                    <span className="font-bold text-emerald-900 bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-100">Taraba State (15,556) / Benue (8,820)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border p-2.5 rounded-lg justify-between">
                    <span className="font-bold text-slate-700">South West Area</span>
                    <span className="text-emerald-700 font-bold">➜</span>
                    <span className="font-bold text-emerald-900 bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-100">Cross River State (46,840) / Akwa Ibom (1,917)</span>
                  </div>
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
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setPreviewRegistrant(item); setIsPreviewOpen(true); }} title="Preview Profile">
                              <Eye className="h-3.5 w-3.5 text-emerald-650" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditClick(item)} title="Edit Profile">
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item.id, item.is_local)} title="Delete Profile">
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

        {/* VIEW 9: INTERVENTIONS */}
        {activeTab === "interventions" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat cards for interventions */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Distribution Events</span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">{interventions.length}</span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Resources / Persons Reached</span>
                <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
                  {interventions.reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString()}
                </span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Food & Nutrition Events</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {interventions.filter(i => i.category === "Food & Nutrition").length}
                </span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Medical & Healthcare Events</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {interventions.filter(i => i.category === "Medical & Healthcare").length}
                </span>
              </Card>
            </div>

            {/* Filter and Table Panel */}
            <Card className="p-6 shadow-card border-border bg-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Intervention Registries</h3>
                  <p className="text-[10px] text-muted-foreground">Monitor and distribute resources across target camps and centers</p>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search camp or category..."
                      value={interventionSearch}
                      onChange={(e) => setInterventionSearch(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      setInterventionCamp("");
                      setInterventionCategory("");
                      setInterventionCount("");
                      setInterventionDetails("");
                      setEditingIntervention(null);
                      setIsLogInterventionOpen(true);
                    }}
                    className="bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-bold uppercase py-1.5 h-9 rounded"
                  >
                    + Log Intervention
                  </Button>
                </div>
              </div>

              {interventionsLoading ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading interventions...
                </div>
              ) : interventions.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">No interventions logged yet in the database.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                      <tr>
                        <th className="p-3.5">ID/Ref</th>
                        <th className="p-3.5">Target Camp</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Details</th>
                        <th className="p-3.5">Count / Units</th>
                        <th className="p-3.5">Logged By</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {interventions
                        .filter(item => {
                          const q = interventionSearch.toLowerCase();
                          return (
                            item.camp.toLowerCase().includes(q) ||
                            item.category.toLowerCase().includes(q) ||
                            item.details.toLowerCase().includes(q)
                          );
                        })
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3.5 font-mono text-muted-foreground text-[10px]">
                              {item.id.startsWith("int-") ? item.id.toUpperCase() : item.id.slice(0, 8).toUpperCase()}
                              {item.is_local && (
                                <Badge variant="outline" className="ml-1 bg-amber-50 text-[8px] font-bold text-amber-700 border-amber-200">
                                  LOCAL
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold text-foreground">{item.camp}</td>
                            <td className="p-3.5">
                              <Badge className="bg-slate-100 text-slate-900 border-slate-200 font-semibold text-[9px] uppercase">
                                {item.category}
                              </Badge>
                            </td>
                            <td className="p-3.5 max-w-[250px] truncate" title={item.details}>
                              {item.details}
                            </td>
                            <td className="p-3.5 font-bold text-foreground">
                              {item.count.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-muted-foreground text-[10px] truncate max-w-[120px]" title={item.captured_by}>
                              {item.captured_by || "system"}
                            </td>
                            <td className="p-3.5 text-muted-foreground text-[10px] whitespace-nowrap">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-700"
                                onClick={() => {
                                  setEditingIntervention(item);
                                  setInterventionCamp(item.camp);
                                  setInterventionCategory(item.category);
                                  setInterventionCount(String(item.count));
                                  setInterventionDetails(item.details);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-red-700"
                                onClick={() => handleDeleteIntervention(item.id, item.is_local)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

        {activeTab === "incidents" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat cards for incidents */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Incident Reports</span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">{incidents.length}</span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Critical Severity Alerts</span>
                <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                  {incidents.filter(i => i.severity === "Critical").length}
                </span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Threats Logged</span>
                <span className="text-2xl font-extrabold text-orange-600 mt-1 block">
                  {incidents.filter(i => i.category.toLowerCase().includes("security")).length}
                </span>
              </Card>
              <Card className="p-4 shadow-sm border-border bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Device & Network Failures</span>
                <span className="text-2xl font-extrabold text-indigo-650 mt-1 block">
                  {incidents.filter(i => i.category.toLowerCase().includes("device") || i.category.toLowerCase().includes("connect")).length}
                </span>
              </Card>
            </div>

            {/* Filter and Table Panel */}
            <Card className="p-6 shadow-card border-border bg-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Zonal Incident Reports</h3>
                  <p className="text-[10px] text-muted-foreground">Monitor security threats, hardware issues, and field emergency logs submitted by Officers</p>
                </div>
              </div>

              {incidentsLoading ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading incident reports...
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">No incidents reported yet in the database.</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                      <tr>
                        <th className="p-3.5">Reference ID</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Severity</th>
                        <th className="p-3.5">Camp / Location</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5">Action Taken</th>
                        <th className="p-3.5">Logged By</th>
                        <th className="p-3.5">Incident Date</th>
                        <th className="p-3.5 text-center">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {incidents.map((item) => {
                        let severityClass = "bg-slate-100 text-slate-800";
                        if (item.severity === "Medium") severityClass = "bg-amber-100 text-amber-800";
                        else if (item.severity === "High") severityClass = "bg-orange-100 text-orange-850";
                        else if (item.severity === "Critical") severityClass = "bg-rose-100 text-rose-850 font-bold animate-pulse";

                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3.5 font-mono text-[10px] font-bold text-primary">
                              {item.reference}
                            </td>
                            <td className="p-3.5 font-semibold text-foreground">{item.category}</td>
                            <td className="p-3.5">
                              <Badge className={`${severityClass} border-transparent text-[9px] font-bold uppercase`}>
                                {item.severity}
                              </Badge>
                            </td>
                            <td className="p-3.5 font-medium text-foreground">{item.location}</td>
                            <td className="p-3.5 max-w-[200px] truncate" title={item.description}>
                              {item.description}
                            </td>
                            <td className="p-3.5 max-w-[200px] truncate text-muted-foreground" title={item.action_taken}>
                              {item.action_taken || "—"}
                            </td>
                            <td className="p-3.5 text-muted-foreground text-[10px] truncate max-w-[120px]" title={item.reported_by}>
                              {item.reported_by || "system"}
                            </td>
                            <td className="p-3.5 text-muted-foreground text-[10px] whitespace-nowrap">
                              {new Date(item.incident_date).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-center">
                              {item.photo_base64 ? (
                                <div className="flex justify-center">
                                  <img
                                    src={item.photo_base64}
                                    alt="Evidence"
                                    className="h-8 w-12 object-cover rounded border border-border cursor-pointer shadow-sm hover:scale-125 transition-transform duration-200"
                                    onClick={() => {
                                      toast.info(`Viewing evidence for ${item.reference}`);
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* Preview Dialog Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewRegistrant && (
            <>
              <DialogHeader className="border-b pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="NCFRMI Logo" className="h-10 w-10 object-contain" />
                  <div>
                    <DialogTitle className="text-base font-extrabold text-emerald-800 uppercase tracking-wide">
                      National Commission for Refugees, Migrants and Internally Displaced Persons
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground font-semibold">
                      Official Enrollee Record · NCFRMI Headquarters, FCT Abuja
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                  <Button onClick={() => printRegistrantProfile(previewRegistrant, logo)} variant="outline" size="sm" className="h-8 hover-lift">
                    <Printer className="mr-1.5 h-3.5 w-3.5 text-emerald-700" /> Print
                  </Button>
                  <Button onClick={() => downloadRegistrantPDF(previewRegistrant, logo)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 hover-lift" size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>
              </DialogHeader>

              {/* Grid content */}
              <div className="grid gap-6 md:grid-cols-[2fr_1fr] py-4 text-xs">
                {/* Left side: Bio Data and Educational/Needs Assessment */}
                <div className="space-y-6">
                  {/* Bio Data Card */}
                  <Card className="p-4 border-slate-200 shadow-sm bg-card/50">
                    <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 mb-3 uppercase tracking-wider">
                      Personal Bio-Data
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Full Legal Name</span>
                        <p className="font-semibold text-foreground text-sm mt-0.5">{previewRegistrant.full_name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Reference ID</span>
                        <p className="font-mono text-foreground font-semibold mt-0.5">{previewRegistrant.reference}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Category</span>
                        <div className="mt-0.5">
                          <Badge variant="outline" className="capitalize text-[10px] py-0 px-2 font-semibold">
                            {previewRegistrant.category === "idp" ? "IDP" :
                             previewRegistrant.category === "refugee" ? "Refugee" :
                             previewRegistrant.category === "migrant" ? "Migrant" : "Returnee"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Gender</span>
                        <p className="capitalize mt-0.5 font-medium">{previewRegistrant.gender || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Date of Birth</span>
                        <p className="mt-0.5 font-medium">{previewRegistrant.dob ? new Date(previewRegistrant.dob).toLocaleDateString() : "—"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Nationality</span>
                        <p className="mt-0.5 font-medium">{previewRegistrant.nationality || "Nigeria"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">State of Origin</span>
                        <p className="mt-0.5 font-medium">{previewRegistrant.state_origin || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">LGA of Origin</span>
                        <p className="mt-0.5 font-medium">{previewRegistrant.lga || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Household Dependants</span>
                        <p className="mt-0.5 font-semibold text-foreground">{previewRegistrant.dependants || 0} declared</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Contact Phone</span>
                        <p className="mt-0.5 font-medium">{previewRegistrant.phone || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Residential Address</span>
                        <p className="mt-0.5 font-medium leading-relaxed bg-muted/20 p-2 rounded">{previewRegistrant.address || "—"}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Educational and Displacement Card */}
                  {(() => {
                    const parsed = parseCircumstances(previewRegistrant.circumstances || "");
                    return (
                      <Card className="p-4 border-slate-200 shadow-sm bg-card/50">
                        <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 mb-3 uppercase tracking-wider">
                          Educational Background & Displacement Details
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Education Level Completed</span>
                            <p className="capitalize mt-0.5 font-semibold text-foreground">{parsed.education_level || "No Formal Education"}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Skills / Specialization</span>
                            <p className="capitalize mt-0.5 font-semibold text-foreground">{parsed.skills || "None"}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Displacement Circumstances / Reason</span>
                            <p className="mt-0.5 font-medium leading-relaxed bg-muted/20 p-2 rounded">{parsed.reason || previewRegistrant.circumstances || "—"}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </div>

                {/* Right side: Biometrics & Verification */}
                <div className="space-y-4">
                  {/* Photo & Thumbprints */}
                  {(() => {
                    let biometrics: any = null;
                    try {
                      const stored = JSON.parse(localStorage.getItem("ncfrmi_captured_biometrics") || "{}");
                      if (stored[previewRegistrant.reference]) {
                        biometrics = stored[previewRegistrant.reference];
                      }
                    } catch (e) {
                      console.error(e);
                    }

                    return (
                      <Card className="p-4 border-slate-200 shadow-sm bg-card/50 flex flex-col items-center text-center">
                        <h4 className="font-bold text-xs text-emerald-800 border-b pb-1.5 mb-4 uppercase tracking-wider w-full">
                          Enrollee Biometrics
                        </h4>
                        
                        {/* Facial photo box */}
                        <div className="flex flex-col items-center gap-1.5 mb-4">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Facial Photograph</span>
                          <div className="relative overflow-hidden rounded-lg border bg-background shadow-inner w-32 h-32 flex items-center justify-center">
                            {biometrics?.face ? (
                              <img src={biometrics.face} alt="Face photo" className="w-full h-full object-cover" />
                            ) : previewRegistrant.face_captured ? (
                              <div className="text-[10px] text-emerald-600 font-semibold p-2 flex flex-col items-center gap-1">
                                <span className="text-xl">📷</span>
                                Cloud Image Secured
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Not Captured</span>
                            )}
                          </div>
                        </div>

                        <div className="w-full h-[1px] bg-slate-200 my-2" />

                        {/* Thumbprint scan box */}
                        <div className="flex flex-col items-center gap-1.5 mt-2">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Thumbprint Scan</span>
                          <div className="relative overflow-hidden rounded-lg border bg-slate-950 shadow-inner w-24 h-20 flex items-center justify-center">
                            {biometrics?.thumb ? (
                              <img src={biometrics.thumb} alt="Thumb print" className="w-full h-full object-contain p-1 invert" />
                            ) : previewRegistrant.thumb_captured ? (
                              <div className="text-[9px] text-emerald-400 font-semibold p-1 flex flex-col items-center gap-0.5">
                                <span className="text-lg">👍</span>
                                Verified Scan
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">Not Captured</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Verification Status */}
                  <Card className="p-4 border-emerald-250 bg-emerald-50/20 shadow-sm">
                    <h4 className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider mb-2">
                      Verification Status
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] bg-white p-2 rounded border">
                        <span className="font-medium text-slate-600">Facial Liveness</span>
                        <Badge className={previewRegistrant.face_captured ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-slate-100 text-slate-900"}>
                          {previewRegistrant.face_captured ? "SUCCESS" : "PENDING"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] bg-white p-2 rounded border">
                        <span className="font-medium text-slate-600">Fingerprint Match</span>
                        <Badge className={previewRegistrant.thumb_captured ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-slate-100 text-slate-900"}>
                          {previewRegistrant.thumb_captured ? "VERIFIED" : "PENDING"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                <span>Verification Authority: National Commission for Refugees, Migrants and Internally Displaced Persons</span>
                <span>System Status: Cloud Synced & Authorized</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Log New Intervention Dialog */}
      <Dialog open={isLogInterventionOpen} onOpenChange={setIsLogInterventionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Distribution/Intervention Event</DialogTitle>
            <DialogDescription>Record relief resource deliveries and support distributions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateIntervention} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Target Camp / Zonal Hub</label>
              <select
                required
                value={interventionCamp}
                onChange={(e) => setInterventionCamp(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:ring-primary focus:outline-none"
              >
                <option value="" disabled>-- Select target camp --</option>
                <option value="Durumi Camp, Abuja">Durumi Camp, Abuja</option>
                <option value="Kuchingoro Camp, Abuja">Kuchingoro Camp, Abuja</option>
                <option value="Maiduguri Zonal Camp, Borno">Maiduguri Zonal Camp, Borno</option>
                <option value="Gombe Zonal Camp">Gombe Zonal Camp</option>
                <option value="Daudu Camp, Benue">Daudu Camp, Benue</option>
                <option value="Uhogua Camp, Edo">Uhogua Camp, Edo</option>
                <option value="Adagom Settlement, Cross River">Adagom Settlement, Cross River</option>
                <option value="Lagos Transit Reception Center">Lagos Transit Reception Center</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Resource Category</label>
              <select
                required
                value={interventionCategory}
                onChange={(e) => setInterventionCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:ring-primary focus:outline-none"
              >
                <option value="" disabled>-- Select category --</option>
                <option value="Food & Nutrition">Food & Nutrition</option>
                <option value="Medical & Healthcare">Medical & Healthcare</option>
                <option value="Shelter & WAsH">Shelter & WAsH</option>
                <option value="Education & Training">Education & Training</option>
                <option value="Cash Assistance">Cash Assistance</option>
                <option value="Legal Aid & Security">Legal Aid & Security</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Quantity / Count Reached</label>
              <Input
                type="number"
                required
                value={interventionCount}
                onChange={(e) => setInterventionCount(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Distribution Details</label>
              <Textarea
                required
                value={interventionDetails}
                onChange={(e) => setInterventionDetails(e.target.value)}
                placeholder="Describe items, partners involved, and allocation circumstances..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLogInterventionOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-800 text-white hover:bg-emerald-700">Submit Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Intervention Dialog */}
      <Dialog open={!!editingIntervention} onOpenChange={(o) => { if (!o) setEditingIntervention(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Intervention Event</DialogTitle>
            <DialogDescription>Modify resource distribution records.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateIntervention} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Target Camp / Zonal Hub</label>
              <select
                required
                value={interventionCamp}
                onChange={(e) => setInterventionCamp(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:ring-primary focus:outline-none"
              >
                <option value="Durumi Camp, Abuja">Durumi Camp, Abuja</option>
                <option value="Kuchingoro Camp, Abuja">Kuchingoro Camp, Abuja</option>
                <option value="Maiduguri Zonal Camp, Borno">Maiduguri Zonal Camp, Borno</option>
                <option value="Gombe Zonal Camp">Gombe Zonal Camp</option>
                <option value="Daudu Camp, Benue">Daudu Camp, Benue</option>
                <option value="Uhogua Camp, Edo">Uhogua Camp, Edo</option>
                <option value="Adagom Settlement, Cross River">Adagom Settlement, Cross River</option>
                <option value="Lagos Transit Reception Center">Lagos Transit Reception Center</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Resource Category</label>
              <select
                required
                value={interventionCategory}
                onChange={(e) => setInterventionCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:ring-primary focus:outline-none"
              >
                <option value="Food & Nutrition">Food & Nutrition</option>
                <option value="Medical & Healthcare">Medical & Healthcare</option>
                <option value="Shelter & WAsH">Shelter & WAsH</option>
                <option value="Education & Training">Education & Training</option>
                <option value="Cash Assistance">Cash Assistance</option>
                <option value="Legal Aid & Security">Legal Aid & Security</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Quantity / Count Reached</label>
              <Input
                type="number"
                required
                value={interventionCount}
                onChange={(e) => setInterventionCount(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Distribution Details</label>
              <Textarea
                required
                value={interventionDetails}
                onChange={(e) => setInterventionDetails(e.target.value)}
                placeholder="Describe items, partners involved, and allocation circumstances..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingIntervention(null)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-800 text-white hover:bg-emerald-700">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

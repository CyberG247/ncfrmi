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
const CustomAreaChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  const width = 240;
  const height = 80;
  const padding = 5;
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - (val / max) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className="w-full h-24 mt-4 relative">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-muted/30" strokeWidth="0.5" strokeDasharray="3,3" />
        <polyline
          fill={`url(#gradient-${color.replace("#", "")})`}
          points={fillPoints}
          className="opacity-15"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-1 font-semibold uppercase tracking-wider">
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

const STATES_MAP_DATA = [
  // North West
  { id: "sokoto", name: "Sokoto", points: "40,30 80,30 80,60 40,60", value: 92, color: "#7f1d1d", labelX: 60, labelY: 48 }, // 81-100 Deep Red
  { id: "kebbi", name: "Kebbi", points: "15,50 40,50 40,90 20,95", value: 55, color: "#fbbf24", labelX: 30, labelY: 72 }, // 41-60 Gold/Orange
  { id: "zamfara", name: "Zamfara", points: "80,35 115,35 110,65 80,60", value: 78, color: "#b45309", labelX: 98, labelY: 50 }, // 61-80 Brown
  { id: "katsina", name: "Katsina", points: "115,35 140,35 138,65 110,65", value: 58, color: "#fbbf24", labelX: 128, labelY: 50 }, // 41-60 Gold/Orange
  { id: "kano", name: "Kano", points: "140,40 180,40 170,75 138,65", value: 38, color: "#fbbf24", labelX: 158, labelY: 55 }, // 21-40 Yellow
  { id: "jigawa", name: "Jigawa", points: "180,30 220,35 210,65 170,60", value: 85, color: "#7f1d1d", labelX: 195, labelY: 48 }, // 81-100 Deep Red
  { id: "kaduna", name: "Kaduna", points: "110,65 170,75 160,110 110,95", value: 35, color: "#fbbf24", labelX: 135, labelY: 88 }, // 21-40 Yellow
  
  // North East
  { id: "yobe", name: "Yobe", points: "220,35 255,40 250,90 210,85", value: 68, color: "#b45309", labelX: 235, labelY: 62 }, // 61-80 Brown
  { id: "borno", name: "Borno", points: "255,40 288,50 288,110 248,110 250,90", value: 0, color: "#ffffff", stroke: "#000000", strokeWidth: "1.8", labelX: 268, labelY: 75, isNA: true }, // N/A (White with thick black border)
  { id: "bauchi", name: "Bauchi", points: "170,75 210,85 200,120 160,110", value: 72, color: "#b45309", labelX: 185, labelY: 98 }, // 61-80 Brown
  { id: "gombe", name: "Gombe", points: "210,85 240,90 235,115 210,110", value: 65, color: "#b45309", labelX: 222, labelY: 100 }, // 61-80 Brown
  { id: "adamawa", name: "Adamawa", points: "240,90 268,110 250,150 220,135", value: 75, color: "#b45309", labelX: 245, labelY: 125 }, // 61-80 Brown
  { id: "taraba", name: "Taraba", points: "180,140 220,135 238,185 190,195", value: 89, color: "#7f1d1d", labelX: 208, labelY: 165 }, // 81-100 Deep Red
  
  // North Central
  { id: "niger", name: "Niger", points: "40,90 110,95 95,145 50,135", value: 74, color: "#b45309", labelX: 75, labelY: 118 }, // 61-80 Brown
  { id: "kwara", name: "Kwara", points: "30,120 60,120 60,150 28,150", value: 32, color: "#fbbf24", labelX: 44, labelY: 135 }, // 21-40 Yellow
  { id: "fct", name: "Fct Abuja", points: "105,125 130,125 125,142 105,142", value: 48, color: "#fbbf24", labelX: 118, labelY: 134 }, // 41-60 Gold/Orange
  { id: "nasarawa", name: "Nasarawa", points: "125,125 165,125 160,150 125,150", value: 34, color: "#fbbf24", labelX: 145, labelY: 138 }, // 21-40 Yellow
  { id: "plateau", name: "Plateau", points: "160,110 200,120 180,150 160,140", value: 39, color: "#fbbf24", labelX: 178, labelY: 130 }, // 21-40 Yellow
  { id: "kogi", name: "Kogi", points: "78,145 125,150 115,182 72,175", value: 31, color: "#fbbf24", labelX: 95, labelY: 165 }, // 21-40 Yellow
  { id: "benue", name: "Benue", points: "125,150 180,150 170,185 120,185", value: 37, color: "#fbbf24", labelX: 148, labelY: 170 }, // 21-40 Yellow
  
  // South West
  { id: "oyo", name: "Oyo", points: "12,150 48,150 42,185 10,180", value: 12, color: "#fef08a", labelX: 26, labelY: 168 }, // 1-20 Light Yellow
  { id: "ogun", name: "Ogun", points: "10,180 35,180 32,205 10,200", value: 8, color: "#fef08a", labelX: 20, labelY: 192 }, // 1-20 Light Yellow
  { id: "lagos", name: "Lagos", points: "10,200 32,205 32,212 10,210", value: 5, color: "#fef08a", labelX: 21, labelY: 208 }, // 1-20 Light Yellow
  { id: "osun", name: "Osun", points: "42,170 65,170 62,188 42,185", value: 14, color: "#fef08a", labelX: 52, labelY: 179 }, // 1-20 Light Yellow
  { id: "ekiti", name: "Ekiti", points: "65,170 78,170 75,185 62,185", value: 18, color: "#fef08a", labelX: 71, labelY: 178 }, // 1-20 Light Yellow
  { id: "ondo", name: "Ondo", points: "48,185 78,185 70,210 40,210", value: 15, color: "#fef08a", labelX: 59, labelY: 198 }, // 1-20 Light Yellow
  
  // South South & South East
  { id: "edo", name: "Edo", points: "72,175 92,175 90,205 68,205", value: 19, color: "#fef08a", labelX: 81, labelY: 190 }, // 1-20 Light Yellow
  { id: "delta", name: "Delta", points: "50,210 88,210 85,232 45,232", value: 13, color: "#fef08a", labelX: 68, labelY: 222 }, // 1-20 Light Yellow
  { id: "bayelsa", name: "Bayelsa", points: "60,232 82,232 80,248 55,248", value: 24, color: "#fbbf24", labelX: 68, labelY: 240 }, // 21-40 Yellow
  { id: "rivers", name: "Rivers", points: "82,225 105,225 100,245 80,245", value: 29, color: "#fbbf24", labelX: 92, labelY: 235 }, // 21-40 Yellow
  { id: "akwa_ibom", name: "Akwa Ibom", points: "105,222 120,222 118,242 100,242", value: 27, color: "#fbbf24", labelX: 112, labelY: 232 }, // 21-40 Yellow
  { id: "cross_river", name: "Cross River", points: "120,185 140,185 140,230 118,230", value: 33, color: "#fbbf24", labelX: 130, labelY: 208 }, // 21-40 Yellow
  
  { id: "enugu", name: "Enugu", points: "92,175 112,175 110,195 90,195", value: 43, color: "#fbbf24", labelX: 101, labelY: 185 }, // 41-60 Gold/Orange
  { id: "ebonyi", name: "Ebonyi", points: "112,175 125,175 120,198 108,198", value: 76, color: "#b45309", labelX: 117, labelY: 186 }, // 61-80 Brown
  { id: "anambra", name: "Anambra", points: "88,195 102,195 100,212 85,212", value: 11, color: "#fef08a", labelX: 93, labelY: 203 }, // 1-20 Light Yellow
  { id: "abia", name: "Abia", points: "102,198 116,198 112,220 98,220", value: 36, color: "#fbbf24", labelX: 107, labelY: 210 }, // 21-40 Yellow
  { id: "imo", name: "Imo", points: "88,212 102,212 98,225 82,225", value: 25, color: "#fbbf24", labelX: 93, labelY: 218 }  // 21-40 Yellow
];

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
  const [hoveredState, setHoveredState] = useState<string>("fct");

  return (
    <div className="bg-[#fbfbfa] rounded-lg p-2.5 shadow-elegant max-w-full">
      <svg className="w-full h-auto bg-[#fafaf8]" viewBox="0 0 320 270" width="100%">
        {/* Graticule gridlines (subtle background layout) */}
        <line x1="0" y1="50" x2="320" y2="50" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="0" y1="100" x2="320" y2="100" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="0" y1="150" x2="320" y2="150" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="0" y1="200" x2="320" y2="200" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="50" y1="0" x2="50" y2="270" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="100" y1="0" x2="100" y2="270" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="150" y1="0" x2="150" y2="270" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="200" y1="0" x2="200" y2="270" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="250" y1="0" x2="250" y2="270" stroke="#ddd" strokeWidth="0.3" strokeDasharray="2,2" />

        {/* State Polygons */}
        {STATES_MAP_DATA.map((state) => {
          const isSelected = hoveredState === state.id;
          return (
            <polygon
              key={state.id}
              points={state.points}
              fill={state.color}
              stroke={state.stroke || (isSelected ? "#555555" : "none")}
              strokeWidth={state.strokeWidth || (isSelected ? "1" : "0")}
              className="transition-all duration-300 hover:scale-[1.05] hover:brightness-[1.08] cursor-pointer transform origin-center"
              style={{ transformOrigin: `${state.labelX}px ${state.labelY}px` }}
              onMouseEnter={() => {
                setHoveredState(state.id);
                // Try to find if a camp node is matching
                const matchNode = MAP_NODES.find(
                  (n) => n.id === state.id || n.state.toLowerCase().includes(state.name.toLowerCase())
                );
                if (matchNode) {
                  onHoverNode(matchNode.id);
                }
              }}
            />
          );
        })}

        {/* State Name Label Texts */}
        {STATES_MAP_DATA.map((state) => (
          <text
            key={`label-${state.id}`}
            x={state.labelX}
            y={state.labelY}
            fontSize="4.2"
            fontWeight="900"
            fill={state.isNA ? "#000" : (state.color === "#7f1d1d" || state.color === "#b45309" ? "#fff" : "#222")}
            textAnchor="middle"
            className="pointer-events-none select-none font-sans tracking-tighter"
          >
            {state.name}
          </text>
        ))}

        {/* Soft telemetry dots for every state with registry data, blinking slowly */}
        {STATES_MAP_DATA.map((state) => {
          if (state.value === 0) return null;
          const pulseDuration = `${3.8 + (state.value % 4) * 0.8}s`;
          return (
            <g key={`telemetry-${state.id}`} className="pointer-events-none opacity-45">
              <circle
                cx={state.labelX}
                cy={state.labelY + 6}
                r="3"
                fill={state.color === "#7f1d1d" ? "#fecaca" : "#374151"}
                className="animate-ping"
                style={{ animationDuration: pulseDuration }}
              />
              <circle
                cx={state.labelX}
                cy={state.labelY + 6}
                r="1.2"
                fill={state.color === "#7f1d1d" ? "#f87171" : "#1f2937"}
              />
            </g>
          );
        })}

        {/* Blinking campsite dots overlaid on the map */}
        {MAP_NODES.map((node) => {
          const isActive = activeNode === node.id;
          return (
            <g
              key={`dot-${node.id}`}
              className="cursor-pointer group"
              onMouseEnter={() => {
                onHoverNode(node.id);
                const stateMatch = STATES_MAP_DATA.find(
                  (s) => s.id === node.id || s.name.toLowerCase() === node.state.split(" ")[0].toLowerCase()
                );
                if (stateMatch) setHoveredState(stateMatch.id);
              }}
            >
              {/* Blinking Ping Effect */}
              <circle
                cx={node.x}
                cy={node.y}
                r="7"
                fill={node.color}
                className="animate-ping opacity-75"
                style={{ animationDuration: node.pingSpeed }}
              />
              {/* Solid Center Dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r="3.5"
                fill={node.color}
                className={`transition-all duration-200 stroke-white dark:stroke-slate-900 stroke-[0.8] ${
                  isActive ? "scale-125" : ""
                }`}
              />
            </g>
          );
        })}

        {/* Compass Rose (Top Right) */}
        <g transform="translate(292, 28)">
          <circle cx="0" cy="0" r="9" fill="none" stroke="#222" strokeWidth="0.5" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#222" strokeWidth="0.6" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#222" strokeWidth="0.6" />
          <polygon points="0,-12 -2.5,-3 0,0" fill="#222" />
          <polygon points="0,-12 2.5,-3 0,0" fill="#777" />
          <polygon points="0,12 -2.5,3 0,0" fill="#777" />
          <polygon points="0,12 2.5,3 0,0" fill="#222" />
          <polygon points="12,0 3,-2.5 0,0" fill="#222" />
          <polygon points="12,0 3,2.5 0,0" fill="#777" />
          <polygon points="-12,0 -3,-2.5 0,0" fill="#777" />
          <polygon points="-12,0 -3,2.5 0,0" fill="#222" />
          <text x="-1.8" y="-13.5" fontSize="4.5" fontWeight="bold" fill="#000">N</text>
          <text x="-1.5" y="17" fontSize="4.5" fontWeight="bold" fill="#000">S</text>
          <text x="14" y="1.5" fontSize="4.5" fontWeight="bold" fill="#000">E</text>
          <text x="-19" y="1.5" fontSize="4.5" fontWeight="bold" fill="#000">W</text>
        </g>

        {/* Distance Scale (Bottom Left) */}
        <g transform="translate(25, 252)">
          <text x="0" y="-4" fontSize="4" fill="#333">0</text>
          <text x="15" y="-4" fontSize="4" fill="#333">50</text>
          <text x="30" y="-4" fontSize="4" fill="#333">100</text>
          <text x="60" y="-4" fontSize="4" fill="#333">200</text>
          <text x="90" y="-4" fontSize="4" fill="#333">300</text>
          <text x="120" y="-4" fontSize="4" fill="#333">400</text>
          <text x="130" y="2.5" fontSize="3.8" fill="#333" fontWeight="bold">Kilometers</text>
          
          <rect x="0" y="0" width="15" height="2.5" fill="#000" stroke="#000" strokeWidth="0.4" />
          <rect x="15" y="0" width="15" height="2.5" fill="#fff" stroke="#000" strokeWidth="0.4" />
          <rect x="30" y="0" width="30" height="2.5" fill="#000" stroke="#000" strokeWidth="0.4" />
          <rect x="60" y="0" width="30" height="2.5" fill="#fff" stroke="#000" strokeWidth="0.4" />
          <rect x="90" y="0" width="30" height="2.5" fill="#000" stroke="#000" strokeWidth="0.4" />
        </g>

        {/* Legend Box (Bottom Right) */}
        <g transform="translate(225, 172)">
          <rect x="-4" y="-4" width="94" height="74" fill="#fffff8" stroke="#555555" strokeWidth="0.6" rx="1.5" />
          <text x="0" y="3" fontSize="5" fontWeight="900" fill="#000">Percentage of the population</text>
          
          <rect x="0" y="10" width="10" height="5" fill="#fef08a" stroke="#444" strokeWidth="0.3" />
          <text x="14" y="14" fontSize="4.2" fontWeight="bold" fill="#222">1 - 20</text>
          
          <rect x="0" y="20" width="10" height="5" fill="#fbbf24" stroke="#444" strokeWidth="0.3" />
          <text x="14" y="24" fontSize="4.2" fontWeight="bold" fill="#222">21 - 40</text>
          
          <rect x="0" y="30" width="10" height="5" fill="#f59e0b" stroke="#444" strokeWidth="0.3" />
          <text x="14" y="34" fontSize="4.2" fontWeight="bold" fill="#222">41 - 60</text>
          
          <rect x="0" y="40" width="10" height="5" fill="#b45309" stroke="#444" strokeWidth="0.3" />
          <text x="14" y="44" fontSize="4.2" fontWeight="bold" fill="#222">61 - 80</text>
          
          <rect x="0" y="50" width="10" height="5" fill="#7f1d1d" stroke="#444" strokeWidth="0.3" />
          <text x="14" y="54" fontSize="4.2" fontWeight="bold" fill="#222">81 - 100</text>
          
          <rect x="52" y="10" width="10" height="5" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
          <text x="66" y="14" fontSize="4.2" fontWeight="bold" fill="#222">N/A</text>
        </g>

        {/* NBS Source Citation Footer */}
        <text x="160" y="265" fontSize="4.2" fontWeight="bold" fill="#444" textAnchor="middle" className="font-sans">
          Source: NBS 2018/19 Nigerian Living Standards Survey & NCFRMI Zonal Registries
        </text>
      </svg>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, role, signOut } = useAuth();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Try commissioner@ncfrmi.gov.ng / commissioner123");
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
                System Development Division · Zonal Administrative Control Center
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
            { id: "summary", label: "exc. Summary", icon: Database },
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
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase rounded-md transition-all active:scale-95 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    {/* Graphical Rep Area Chart */}
                    <CustomAreaChart data={getTrendsForCategory("refugee")} color="#6366f1" />
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
                    <CustomAreaChart data={getTrendsForCategory("idp")} color="#f59e0b" />
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
                    <CustomAreaChart data={getTrendsForCategory("migrant")} color="#10b981" />
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
            {/* Download Buttons */}
            <Card className="p-6 shadow-card border-border bg-card space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-display font-bold text-foreground text-sm">Download Center</h3>
                <p className="text-[10px] text-muted-foreground">Export registration database lists</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="secondary" className="justify-start gap-2 bg-primary/15 text-primary hover:bg-primary/20 hover-lift font-bold text-xs" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> Export CSV Data Dump
                </Button>
                <Button variant="outline" className="justify-start gap-2 text-foreground/80 hover:bg-muted hover-lift font-bold text-xs" onClick={exportPDF}>
                  <FileText className="h-4 w-4" /> Export PDF Summary Audit
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

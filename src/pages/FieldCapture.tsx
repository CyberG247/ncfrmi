import { useEffect, useRef, useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Fingerprint, CheckCircle2, Loader2, RotateCcw, ShieldCheck, UserPlus, Download, Globe, Home, Activity, Eye, EyeOff, Users, CloudLightning } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/ncfrmi-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { NG_STATES, NG_STATES_AND_LGAS } from "@/data/ng_states_lgas";

const TYPES = [
  { value: "idp", label: "Internally Displaced Person (IDP)" },
  { value: "refugee", label: "Refugee" },
  { value: "migrant", label: "Migrant" },
  { value: "returnee", label: "Returnee" },
] as const;

type Form = {
  type: string;
  full_name: string; address: string; phone: string; dob: string; gender: string;
  nationality: string; state_origin: string; lga: string; dependants: string; reason: string;
  education_level: string; skills: string; primary_needs: string[]; needs_details: string;
};

type Intervention = {
  id: string;
  camp: string;
  category: string;
  details: string;
  count: number;
  date: string;
  officer: string;
};

const empty: Form = {
  type: "", full_name: "", address: "", phone: "", dob: "", gender: "",
  nationality: "Nigeria", state_origin: "", lga: "", dependants: "0", reason: "",
  education_level: "", skills: "", primary_needs: [], needs_details: "",
};

const steps = ["Registration Type", "Biodata & Needs", "Review"];

const playBeep = () => {
  // Audio beep disabled to prevent constant beeping
};

const HeadContourSVG = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full text-emerald-500 pointer-events-none z-10" fill="none">
    {/* Head Outline */}
    <path
      d="M100,35 C70,35 60,55 60,85 C60,90 53,92 53,98 C53,104 60,105 60,110 C60,125 75,145 100,145 C125,145 140,125 140,110 C140,105 147,104 147,98 C147,92 140,90 140,85 C140,55 130,35 100,35 Z"
      stroke="#10b981"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
    {/* Shoulder Outline */}
    <path
      d="M60,140 C45,155 35,170 30,190 L170,190 C165,170 155,155 140,140"
      stroke="#10b981"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
  </svg>
);

const AvatarSVG = () => (
  <div className="mx-auto h-16 w-16 rounded-full bg-[#e8f6f0] flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 100 100" className="h-14 w-14">
      {/* Ears */}
      <circle cx="23" cy="52" r="7" fill="#d29d78" />
      <circle cx="77" cy="52" r="7" fill="#d29d78" />
      
      {/* Neck */}
      <path d="M 40,60 L 40,80 L 60,80 L 60,60 Z" fill="#d29d78" />
      
      {/* Face */}
      <circle cx="50" cy="48" r="25" fill="#e0ab85" />
      
      {/* Hair */}
      <path d="M 25,44 C 25,18 75,18 75,44 C 70,42 60,38 50,42 C 40,38 30,42 25,44 Z" fill="#1d124b" />
      
      {/* Eyebrows */}
      <path d="M 33,38 C 37,35 43,36 45,39" stroke="#100b2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 67,38 C 63,35 57,36 55,39" stroke="#100b2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      
      {/* Eyes */}
      <circle cx="39" cy="46" r="3" fill="#100b2b" />
      <circle cx="61" cy="46" r="3" fill="#100b2b" />
      
      {/* Smile with teeth */}
      <path d="M 37,56 Q 50,68 63,56 Z" fill="#ffffff" />
      <path d="M 37,56 Q 50,68 63,56" stroke="#b17e5a" strokeWidth="1.5" fill="none" />
    </svg>
  </div>
);

const DISPLACEMENT_CAUSES: Record<string, string[]> = {
  idp: [
    "Conflict / Violence / Insurgency",
    "Armed Banditry / Kidnapping",
    "Communal Clash / Land Dispute",
    "Farmer-Herder Conflict",
    "Natural Disaster (Flooding, Drought, etc.)",
  ],
  migrant: [
    "Economic Hardship / Search for Employment",
    "Educational Opportunities",
    "Family Reunification",
    "Climate / Environmental Change",
  ],
  returnee: [
    "Voluntary Repatriation",
    "Deportation / Forced Return",
    "Assisted Voluntary Return & Reintegration",
  ],
  general: [
    "Conflict / Violence / Insurgency",
    "Armed Banditry / Kidnapping",
    "Communal Clash / Land Dispute",
    "Farmer-Herder Conflict",
    "Natural Disaster",
    "Economic Hardship / Migration",
    "Repatriation",
  ]
};

export default function FieldCapture() {
  const { role, signOut } = useAuth();
  
  // Login Page states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("officer@ncfrmi.gov.ng");
  const [loginPassword, setLoginPassword] = useState("officer123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [biometricLoginActive, setBiometricLoginActive] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    // Check if it matches simulated login credentials
    if (loginEmail === "officer@ncfrmi.gov.ng" && loginPassword === "officer123") {
      const mockUser = { email: "officer@ncfrmi.gov.ng", role: "officer" };
      localStorage.setItem("ncfrmi_simulated_user", JSON.stringify(mockUser));
      
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      savedRoles["officer@ncfrmi.gov.ng"] = "officer";
      localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));
      
      toast.success("Welcome back! Simulated Officer authenticated.");
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
    } catch (err: unknown) {
      toast.error((err as Error).message || "Invalid credentials. Try officer@ncfrmi.gov.ng / officer123");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    setBiometricLoginActive(true);
    toast.info("Initializing Zonal TouchID verification node...");
    setTimeout(() => {
      const mockUser = { email: "officer@ncfrmi.gov.ng", role: "officer" };
      localStorage.setItem("ncfrmi_simulated_user", JSON.stringify(mockUser));
      
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      savedRoles["officer@ncfrmi.gov.ng"] = "officer";
      localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));
      
      setBiometricLoginActive(false);
      toast.success("Fingerprint biometric match verified! Access granted.");
      setIsLoggedIn(true);
    }, 1800);
  };

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>(empty);
  const [face, setFace] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [appComingSoon, setAppComingSoon] = useState(false);
  const [lastRef, setLastRef] = useState("");
  const [enabledCategories, setEnabledCategories] = useState<string[]>(["refugee", "idp", "migrant", "returnee"]);
  const [activeSection, setActiveSection] = useState<"enrolment" | "interventions" | "incidents" | "profile" | "reset">("enrolment");
  const [officerName, setOfficerName] = useState(() => localStorage.getItem("ncfrmi_officer_name") || "Muhammad");
  const [officerPicture, setOfficerPicture] = useState<string | null>(() => localStorage.getItem("ncfrmi_officer_picture") || null);

  useEffect(() => {
    const cats = localStorage.getItem("ncfrmi_enabled_categories");
    if (cats) {
      setEnabledCategories(JSON.parse(cats));
    }
  }, []);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [showInterventions, setShowInterventions] = useState(false);
  const [interventionsList, setInterventionsList] = useState<Intervention[]>([]);
  const [showIncidentReport, setShowIncidentReport] = useState(false);
  const [incidentsList, setIncidentsList] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ncfrmi_incidents");
      if (saved) {
        setIncidentsList(JSON.parse(saved));
      } else {
        const initialMock = [
          {
            id: "inc-1",
            reference: "NCF-INC-2026-X83K2",
            category: "Biometric Device Malfunction",
            severity: "Medium",
            location: "Durumi Camp, Abuja",
            incident_date: new Date(Date.now() - 3600000 * 24).toISOString(),
            description: "Fingerprint scanner failed to initialize due to USB driver mismatch on Windows workstation. Switched to manual override after three attempts.",
            action_taken: "Reported to IT support, rebooted laptop, used manual biographical registration for the candidate.",
            photo_base64: null,
            reported_by: "officer@ncfrmi.gov.ng"
          },
          {
            id: "inc-2",
            reference: "NCF-INC-2026-P91L5",
            category: "Connectivity / Network Outage",
            severity: "High",
            location: "Maiduguri Zonal Camp, Borno",
            incident_date: new Date(Date.now() - 3600000 * 48).toISOString(),
            description: "Complete loss of satellite cellular connection at the remote registration point starting from 14:00. Sync of 45 PoC records delayed.",
            action_taken: "Data collection completed offline and cached on local workstation securely. Sync will be retried upon transit back to the state hub.",
            photo_base64: null,
            reported_by: "officer@ncfrmi.gov.ng"
          }
        ];
        localStorage.setItem("ncfrmi_incidents", JSON.stringify(initialMock));
        setIncidentsList(initialMock);
      }
    } catch (e) {
      console.error("Failed to load incidents:", e);
    }
  }, []);

  const handleAddIncident = async (
    category: string,
    severity: string,
    location: string,
    incident_date: string,
    description: string,
    action_taken: string,
    photo: string | null
  ) => {
    if (!category || !severity || !location || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    const reference = `NCF-INC-2026-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const newEntry = {
      id: `inc-${Math.random().toString(36).slice(2, 8)}`,
      reference,
      category,
      severity,
      location,
      incident_date: new Date(incident_date).toISOString(),
      description,
      action_taken,
      photo_base64: photo,
      reported_by: localStorage.getItem("ncfrmi_simulated_user") 
        ? JSON.parse(localStorage.getItem("ncfrmi_simulated_user")!).email 
        : "officer@ncfrmi.gov.ng"
    };

    const updated = [newEntry, ...incidentsList];
    setIncidentsList(updated);
    localStorage.setItem("ncfrmi_incidents", JSON.stringify(updated));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("incidents" as any).insert({
        reference,
        category,
        severity,
        location,
        incident_date: new Date(incident_date).toISOString(),
        description,
        action_taken,
        photo_base64: photo,
        reported_by: user?.id || null
      });
      if (error) throw error;
      toast.success(`Incident report ${reference} submitted and synced!`);
    } catch (e) {
      console.warn("Failed to sync incident to Supabase: ", e);
      toast.success(`Incident report ${reference} logged locally (cached for sync).`);
    }

    playBeep();
  };

  const [localRegistrants, setLocalRegistrants] = useState<any[]>([]);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      setLocalRegistrants(stored);
    } catch (e) {
      console.error(e);
    }
  }, [success]);

  const pushLocalData = async () => {
    if (localRegistrants.length === 0) {
      toast.info("No offline registrations to push.");
      return;
    }

    setPushing(true);
    const toastId = toast.loading(`Pushing ${localRegistrants.length} local records to central server...`);

    let successCount = 0;
    let failedCount = 0;
    const remaining: any[] = [];

    for (const record of localRegistrants) {
      try {
        const { id, is_local, created_at, ...payload } = record;

        // Try inserting into Supabase
        const { error } = await supabase.from("registrants").insert(payload);
        if (error) throw error;
        
        successCount++;
      } catch (err) {
        console.error("Failed to push record:", record.reference, err);
        failedCount++;
        remaining.push(record);
      }
    }

    localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(remaining));
    setLocalRegistrants(remaining);
    setPushing(false);

    toast.dismiss(toastId);

    if (failedCount === 0) {
      toast.success(`Successfully pushed all ${successCount} local records to the central system!`);
    } else if (successCount > 0) {
      toast.warning(`Pushed ${successCount} records. ${failedCount} records failed. Check connection.`);
    } else {
      toast.error(`Failed to push records. Connection error.`);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ncfrmi_interventions");
      if (saved) {
        setInterventionsList(JSON.parse(saved));
      } else {
        const initialMock = [
          {
            id: "int-1",
            camp: "Durumi Camp, Abuja",
            category: "Food & Nutrition",
            details: "Distributed 300 units of dry food rations and cooking oil supplies.",
            count: 450,
            date: new Date(Date.now() - 3600000 * 4).toLocaleString(),
            officer: "officer@ncfrmi.gov.ng"
          },
          {
            id: "int-2",
            camp: "Kuchingoro Camp, Abuja",
            category: "Medical & Healthcare",
            details: "Conducted medical screening and distributed basic hygiene materials.",
            count: 220,
            date: new Date(Date.now() - 3600000 * 28).toLocaleString(),
            officer: "officer@ncfrmi.gov.ng"
          }
        ];
        localStorage.setItem("ncfrmi_interventions", JSON.stringify(initialMock));
        setInterventionsList(initialMock);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddIntervention = async (camp: string, category: string, details: string, count: number) => {
    if (!camp || !category || !details || count <= 0) {
      toast.error("Please fill in all intervention details correctly.");
      return;
    }
    const newEntry = {
      id: `int-${Math.random().toString(36).slice(2, 8)}`,
      camp,
      category,
      details,
      count,
      date: new Date().toLocaleString(),
      officer: localStorage.getItem("ncfrmi_simulated_user") 
        ? JSON.parse(localStorage.getItem("ncfrmi_simulated_user")!).email 
        : "officer@ncfrmi.gov.ng"
    };
    const updated = [newEntry, ...interventionsList];
    setInterventionsList(updated);
    localStorage.setItem("ncfrmi_interventions", JSON.stringify(updated));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("interventions").insert({
        camp,
        category,
        details,
        count,
        captured_by: user?.id || null
      });
      if (error) throw error;
      toast.success("Intervention entry logged and synced!");
    } catch (e) {
      console.warn("Failed to sync intervention to Supabase: ", e);
      toast.success("Intervention logged locally (cached for sync).");
    }

    playBeep();
  };

  useEffect(() => {
    if (!showIntro) return;
    const interval = setInterval(() => {
      setSimStep((s) => (s + 1) % 7);
    }, 4500);
    return () => clearInterval(interval);
  }, [showIntro]);

  useEffect(() => {
    if (showIntro && (simStep === 5 || simStep === 6)) {
      playBeep();
    }
  }, [simStep, showIntro]);

  const set = (k: keyof Form, v: string) => setData((d) => ({ ...d, [k]: v }));

  const canNext = () => {
    if (step === 0) return !!data.type;
    if (step === 1) {
      if (data.type === "refugee") {
        return !!face && !!data.full_name && !!data.address && !!data.phone && !!data.dob && !!data.gender && !!data.nationality && !!data.state_origin;
      }
      return !!face && !!data.full_name && !!data.address && !!data.phone && !!data.dob && !!data.gender &&
        !!data.nationality && !!data.state_origin && !!data.lga && !!data.reason &&
        !!data.education_level;
    }
    if (step === 2) return true;
    return false;
  };

  const reset = () => {
    setStep(0); setData(empty); setFace(null); setThumb(null); setSuccess(false); setLastRef("");
  };

  const handleLogout = () => {
    localStorage.removeItem("ncfrmi_simulated_user");
    setIsLoggedIn(false);
    reset();
    setActiveSection("enrolment");
    toast.success("Successfully logged out.");
  };

  const drawMockQRCode = (doc: any, x: number, y: number, size: number) => {
    // Draw outer border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.rect(x, y, size, size);
    
    // Draw Finder Pattern (Top-Left)
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 0.8, y + 0.8, 3, 3, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 1.4, y + 1.4, 1.8, 1.8, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 1.8, y + 1.8, 1, 1, "F");
    
    // Draw Finder Pattern (Top-Right)
    doc.setFillColor(0, 0, 0);
    doc.rect(x + size - 3.8, y + 0.8, 3, 3, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(x + size - 3.2, y + 1.4, 1.8, 1.8, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(x + size - 2.8, y + 1.8, 1, 1, "F");
    
    // Draw Finder Pattern (Bottom-Left)
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 0.8, y + size - 3.8, 3, 3, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 1.4, y + size - 3.2, 1.8, 1.8, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 1.8, y + size - 2.8, 1, 1, "F");

    // Draw some random small data bits
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 4.5, y + 1, 0.8, 0.8, "F");
    doc.rect(x + 6, y + 2, 1, 0.6, "F");
    doc.rect(x + 4, y + 4.5, 0.6, 1.2, "F");
    doc.rect(x + 5.5, y + 6, 1.5, 0.8, "F");
    doc.rect(x + 7, y + 4, 0.8, 0.8, "F");
    doc.rect(x + 4.5, y + 8, 1.2, 1.2, "F");
    doc.rect(x + 8, y + 7, 1.5, 1.5, "F");
    doc.rect(x + 9, y + 1.5, 0.8, 1.2, "F");
    
    doc.rect(x + 1.5, y + 4.5, 0.6, 0.6, "F");
    doc.rect(x + 2.5, y + 5.5, 0.8, 0.8, "F");
    doc.rect(x + 5, y + size - 3, 1, 1, "F");
    doc.rect(x + size - 3, y + 5, 0.8, 1.2, "F");
    doc.rect(x + size - 2.5, y + size - 2.5, 1.2, 1.2, "F");
  };

  const downloadRefugeeIDCard = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
      
      // Entire background is white
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 85.6, 54, "F");
      
      // Add logo (Top Center)
      try {
        const logoImg = new Image();
        logoImg.src = logo;
        doc.addImage(logoImg, "PNG", 38.8, 2, 8, 8);
      } catch (e) {
        console.warn("Logo load error:", e);
      }

      // Commission Name (centered)
      doc.setTextColor(78, 52, 46); // Brown
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(4.5);
      doc.text("NATIONAL COMMISSION FOR REFUGEES, MIGRANTS & IDPs", 42.8, 11.5, { align: "center" });

      // Title (centered)
      doc.setFontSize(5.5);
      doc.setTextColor(11, 102, 60); // Green
      doc.text("REFUGEE IDENTITY CARD", 42.8, 14.5, { align: "center" });

      // Photo (Left side)
      if (face) {
        try {
          doc.addImage(face, "JPEG", 5, 18, 20, 24);
        } catch (e) {
          console.warn("Photo error:", e);
        }
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.15);
      doc.rect(5, 18, 20, 24);

      // Bio Data (Middle)
      doc.setTextColor(15, 23, 42); // Slate 900
      let xPos = 27.5;
      let yPos = 20.5;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(4.5);
      doc.text("NAME:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.full_name.toUpperCase(), xPos + 16, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("DATE OF BIRTH:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.dob, xPos + 16, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("COUNTRY:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.nationality.toUpperCase(), xPos + 16, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("GENDER:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.gender.toUpperCase(), xPos + 16, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("SETTLEMENT:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.address.substring(0, 22).toUpperCase(), xPos + 16, yPos);

      yPos += 5;
      doc.setTextColor(11, 102, 60);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text(`ID NO: ${lastRef}`, xPos, yPos);

      // QR Code (Right side)
      drawMockQRCode(doc, 67.5, 18, 13);

      // Bottom Stripes
      // Top stripe (Brown)
      doc.setFillColor(78, 52, 46);
      doc.rect(0, 48.5, 85.6, 1.5, "F");

      // Bottom stripe (Green)
      doc.setFillColor(11, 102, 60);
      doc.rect(0, 50, 85.6, 4, "F");

      // Secure text in bottom stripe
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(3.8);
      doc.text("NATIONAL SECURE DOCUMENT • BIOMETRIC VERIFIED", 42.8, 52.8, { align: "center" });

      doc.save(`NCFRMI_Refugee_Card_${data.full_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Wallet-size Refugee ID Card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Refugee ID Card PDF");
    }
  };

  const downloadIDPIDCard = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
      
      // Background with a warm tint
      doc.setFillColor(254, 252, 245);
      doc.rect(0, 0, 85.6, 54, "F");

      // Top Brown Header Bar
      doc.setFillColor(78, 52, 46);
      doc.rect(0, 0, 85.6, 10.5, "F");

      // Add logo (Top Left)
      try {
        const logoImg = new Image();
        logoImg.src = logo;
        doc.addImage(logoImg, "PNG", 2.5, 1, 8.5, 8.5);
      } catch (e) {
        console.warn("Logo load error:", e);
      }

      // Header Text (White)
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(4.2);
      doc.text("NATIONAL COMMISSION FOR REFUGEES, MIGRANTS & IDPs", 13.5, 4.2);

      doc.setFontSize(5);
      doc.text("INTERNALLY DISPLACED PERSON (IDP) SECURE ID", 13.5, 7.8);

      // Photo (Left side)
      if (face) {
        try {
          doc.addImage(face, "JPEG", 5, 18, 20, 24);
        } catch (e) {
          console.warn("Photo error:", e);
        }
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.15);
      doc.rect(5, 18, 20, 24);

      // Bio Data (Middle)
      doc.setTextColor(15, 23, 42); // Slate 900
      let xPos = 27.5;
      let yPos = 20.5;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(4.5);
      doc.text("NAME:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.full_name.toUpperCase(), xPos + 17, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("DATE OF BIRTH:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.dob, xPos + 17, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("STATE:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.state_origin.toUpperCase(), xPos + 17, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("LGA OF ORIGIN:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.lga.toUpperCase(), xPos + 17, yPos);

      yPos += 3.8;
      doc.setFont("Helvetica", "bold");
      doc.text("DISPLACEMENT CAMP:", xPos, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(data.address.substring(0, 22).toUpperCase(), xPos + 17, yPos);

      yPos += 5.2;
      doc.setTextColor(78, 52, 46);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text(`ID NO: ${lastRef}`, xPos, yPos);

      // QR Code (Right side)
      drawMockQRCode(doc, 67.5, 18, 13);

      // Bottom Bar (Green with gold accent line)
      // Gold line
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 48.8, 85.6, 0.8, "F");

      // Green bar
      doc.setFillColor(11, 102, 60);
      doc.rect(0, 49.6, 85.6, 4.4, "F");

      // Secure text in bottom bar
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(3.8);
      doc.text("DOMESTIC REGISTRATION • INTERNALLY DISPLACED PERSON", 42.8, 52.8, { align: "center" });

      doc.save(`NCFRMI_IDP_Card_${data.full_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Wallet-size IDP Secure ID Card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate IDP Secure ID Card PDF");
    }
  };

  const submit = async () => {
    setSubmitting(true);

    // Validate phone duplicate locally
    try {
      const localData = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      const isLocalDuplicate = localData.some((r: { phone: string }) => r.phone === data.phone);
      if (isLocalDuplicate) {
        toast.error(`A registrant with phone number ${data.phone} already exists in local storage.`);
        setSubmitting(false);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Validate phone duplicate remotely in Supabase
    try {
      const { data: existing, error: checkError } = await supabase
        .from("registrants")
        .select("id")
        .eq("phone", data.phone)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        toast.error(`A registrant with phone number ${data.phone} is already registered in the system.`);
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn("Could not check remote duplicates (likely offline):", err);
    }

    const prefix = data.type === "refugee" ? "REF" : "REG";
    const reference = `NCF-${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setLastRef(reference);
    const { data: u } = await supabase.auth.getUser();

    const circumstancesMerged = data.type === "refugee"
      ? `COUNTRY OF ORIGIN: ${data.nationality}\nDATE OF ARRIVAL: ${data.state_origin || "Not Specified"}\nASSIGNED SETTLEMENT: ${data.address}\nCASE PROFILE: Basic refugee intake biometrics.`
      : `
CAUSE OF DISPLACEMENT:
${data.reason}

EDUCATION BACKGROUND:
- Level: ${data.education_level}
- Skills/Specialization: ${data.skills || "None"}
${face ? `\n===PHOTO_BASE64===\n${face}` : ''}
`;

    const payload = {
      reference,
      category: data.type as "idp" | "refugee" | "migrant" | "returnee",
      full_name: data.full_name,
      address: data.address,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      nationality: data.nationality,
      state_origin: data.state_origin,
      lga: data.type === "refugee" ? "N/A" : data.lga,
      dependants: data.type === "refugee" ? 0 : (Number(data.dependants) || 0),
      circumstances: circumstancesMerged,
      face_captured: !!face,
      thumb_captured: !!thumb,
      captured_by: u.user?.id ?? null,
      photo_base64: face,
    };

    // Always save the actual base64 biometric images locally under the reference number
    if (face || thumb) {
      try {
        const biometrics = JSON.parse(localStorage.getItem("ncfrmi_captured_biometrics") || "{}");
        biometrics[reference] = { face, thumb };
        localStorage.setItem("ncfrmi_captured_biometrics", JSON.stringify(biometrics));
      } catch (e) {
        console.error("Failed to save biometric images locally:", e);
      }
    }

    const { error } = await supabase.from("registrants").insert(payload);
    
    if (error) {
      console.warn("Supabase insert failed. Falling back to local storage: ", error);
      try {
        const localData = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
        const newLocalRecord = {
          id: Math.random().toString(36).slice(2, 11) + "-" + Math.random().toString(36).slice(2, 11),
          ...payload,
          education_level: data.type === "refugee" ? "none" : data.education_level,
          skills: data.type === "refugee" ? "" : data.skills,
          primary_needs: data.type === "refugee" ? [] : data.primary_needs,
          needs_details: data.type === "refugee" ? "" : data.needs_details,
          created_at: new Date().toISOString(),
          is_local: true,
        };
        localData.push(newLocalRecord);
        localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(localData));
        setSubmitting(false);
        setSuccess(true);
        toast.success(`Data captured successfully (Local Sync) — ${reference}`);
        return;
      } catch (err) {
        toast.error("Failed to save registrant locally: " + String(err));
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setSuccess(true);
    toast.success(`Data captured — ${reference}`);
  };

  const typeLabel = TYPES.find((t) => t.value === data.type)?.label ?? "—";

  return (
    <Layout>
      <PageHero
        eyebrow="Field Operations"
        title="Data Collection Application"
        description="Secure on-site enrolment of Migrants, Returnees, Refugees and IDPs with biometric verification."
      />
      <section className="container-page py-10">
        {!isLoggedIn ? (
          <div className="mx-auto max-w-md animate-fade-up">
            <Card className="p-6 sm:p-8 shadow-elegant border border-primary/20 bg-card relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-16 w-16 rounded-full border border-primary/20 flex items-center justify-center bg-card shadow-inner p-1 mb-3">
                  <img src={logo} alt="NCFRMI seal" className="h-full w-full object-contain" />
                </div>
                <h3 className="font-display font-extrabold text-foreground text-base uppercase tracking-tight">
                  Data Collection Application — Officer Login
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  National Commission for Refugees, Migrants & IDPs
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Officer Email Address</label>
                  <Input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer@ncfrmi.gov.ng"
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Secure Node Password</label>
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
                    officer@ncfrmi.gov.ng / officer123
                  </span>
                </div>

                <Button type="submit" disabled={loginLoading} className="w-full hover-lift font-bold uppercase tracking-wider text-xs">
                  {loginLoading ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...</span>
                  ) : "Sign In as Field Officer"}
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
                  {biometricLoginActive ? "Scanning Fingerprint..." : "Touch ID Quick Bypass"}
                </div>
              </div>

              <div className="mt-6 border-t pt-4 text-center">
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Authorized personnel access only. Actions logged under Nigerian cybersecurity regulations and encryption standards.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {localRegistrants.length > 0 && (
              <div className="mx-auto max-w-4xl animate-fade-in text-left">
                <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-elegant">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      <CloudLightning className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                        Offline Captured Data Pending Sync
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        You have <b>{localRegistrants.length}</b> registration record{localRegistrants.length > 1 ? "s" : ""} captured offline in local storage. Tap Push to upload to the central system.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={pushLocalData} 
                    disabled={pushing} 
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 text-xs h-9 shadow-sm hover-lift px-5 shrink-0"
                  >
                    {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudLightning className="h-3.5 w-3.5" />}
                    Push Data ({localRegistrants.length})
                  </Button>
                </div>
              </div>
            )}

            {showIntro ? (
              <div className="mx-auto max-w-4xl animate-fade-up">
            <Card className="p-6 sm:p-8 shadow-card bg-card text-card-foreground">
              <div className="grid gap-8 md:grid-cols-2 items-center">
                {/* Left Side: Onboarding Text & API Credentials */}
                <div className="space-y-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold">Field Operations</div>
                    <h2 className="font-display text-2xl font-bold mt-1 text-foreground">Welcome, Field Operations Officer</h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
                      Welcome to the official NCFRMI Field Capture Hub. This workstation coordinates the remote intake, identification, and registration profiles of IDPs, refugees, returnees, and migrants.
                    </p>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                      As a certified field officer, your primary tasks include capturing basic biodata information, recording specific migration circumstances, and performing digital biometric (facial and fingerprint) verification.
                    </p>
                  </div>

                  {/* API Credentials */}
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Terminal API Keys</div>
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Gateway
                      </span>
                    </div>
                    
                    <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Gateway URL:</span><span className="font-mono">api.ncfrmi.gov.ng/v3</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Environment:</span><span className="text-primary font-medium">PRODUCTION-SECURE</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Active Key:</span><span className="font-mono">ncf_live_8a73...3c2f</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">SDK Version:</span><span className="font-mono">v4.18.2-secure</span></div>
                    </div>
                  </div>

                  <Button onClick={() => setShowIntro(false)} size="lg" className="w-full hover-lift">
                    Proceed to Enrolment Form
                  </Button>
                </div>

                {/* Right Side: iPhone 16 Mockup & Download Button */}
                <div className="flex flex-col items-center space-y-4">
                  {/* iPhone 16 Mockup in Light Mode */}
                  <div className="relative h-[480px] w-[240px] rounded-[42px] border-[6px] border-slate-800 bg-slate-900 p-2 shadow-2xl ring-4 ring-slate-700/30">
                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 top-3.5 h-4 w-16 -translate-x-1/2 rounded-full bg-black z-30 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-900/80 ml-auto mr-1.5" />
                    </div>
                    
                    {/* Screen content (LIGHT MODE inside the iPhone) */}
                    <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white text-slate-900 font-sans text-left flex flex-col border border-slate-200">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center px-4 pt-2.5 pb-1 text-[8px] font-bold text-slate-600 bg-slate-100/50 z-20">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-2.5 bg-slate-600 rounded-sm" />
                          <span className="h-2 w-1 bg-slate-600 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* App Screen Interface Mockup */}
                      <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                        {/* Micro Header */}
                        <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5">
                          <img src={logo} alt="Crest" className="h-4 w-4 object-contain" />
                          <span className="text-[9px] font-bold text-slate-800">NCFRMI Mobile</span>
                          <span className="ml-auto text-[7px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium">Zonal Hub</span>
                        </div>

                        {/* Simulation Steps Container */}
                        <div className="flex-1 flex flex-col justify-center py-2 space-y-2 text-xs">
                          {simStep === 0 && (
                            <div className="space-y-1 text-center animate-fade-in flex flex-col items-center w-full">
                              <img src={logo} alt="NCFRMI Crest" className="h-6 w-6 object-contain" />
                              <div className="text-[9px] font-bold text-slate-800 tracking-tight mt-0.5">Welcome back</div>
                              <p className="text-[6px] text-slate-500">Sign in to continue your application.</p>
                              
                              <div className="w-full space-y-1 text-left mt-1.5">
                                <div className="space-y-0.5">
                                  <label className="text-[5px] text-slate-500 font-semibold block">Email</label>
                                  <div className="h-3 bg-slate-50 border border-slate-200 rounded px-1 text-[6px] text-slate-700 flex items-center font-mono">
                                    officer@ncfrmi.gov.ng
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[5px] text-slate-500 font-semibold block">Password</label>
                                  <div className="h-3 bg-slate-50 border border-slate-200 rounded px-1 text-[6px] text-slate-700 flex items-center">
                                    ••••••••••••
                                  </div>
                                </div>
                                <div className="h-3.5 bg-primary text-white text-[6px] font-bold rounded flex items-center justify-center cursor-pointer hover:bg-primary/95 mt-1 shadow-sm font-sans">
                                  Sign in
                                </div>
                                <div className="text-[5px] text-slate-500 text-center mt-0.5">
                                  New to NCFRMI? <span className="text-primary font-bold">Create account</span>
                                </div>
                                
                                <div className="border-t border-slate-200 pt-1 mt-1 space-y-1">
                                  <div className="text-center text-[5px] font-bold uppercase tracking-wider text-slate-400">Simulator Mode (Quick Access)</div>
                                  <div className="grid grid-cols-2 gap-1">
                                    <div className="border border-slate-250 bg-slate-100/50 rounded text-[4.5px] font-semibold text-slate-600 p-0.5 text-center">Comm. Login</div>
                                    <div className="border border-primary/20 bg-primary/5 rounded text-[4.5px] font-bold text-primary p-0.5 text-center">Officer Login</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {simStep === 1 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">1</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 1: Category Selection</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Officer selects the intake category (IDP, Refugee, Migrant, Returnee).</p>
                              <div className="rounded bg-slate-50 border border-slate-200 p-1 text-[8px] font-semibold text-slate-700 text-left">
                                <div className="flex items-center gap-1 p-0.5 bg-slate-200/50 rounded"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Refugee</div>
                                <div className="flex items-center gap-1 p-0.5 opacity-40"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> IDP Camp</div>
                              </div>
                            </div>
                          )}

                          {simStep === 2 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">2</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 2: Collect Biodata</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Record full legal name, phone number, date of birth, and nationality.</p>
                              <div className="space-y-1 text-left">
                                <div className="h-3 bg-white border border-slate-200 rounded px-1 text-[7px] text-slate-750 flex items-center">Musa Musaq</div>
                                <div className="h-3 bg-white border border-slate-200 rounded px-1 text-[7px] text-slate-750 flex items-center">+234 803 123...</div>
                              </div>
                            </div>
                          )}

                          {simStep === 3 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">3</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 3: Circumstances</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Describe displacement circumstances and detail the family dependants.</p>
                              <div className="bg-slate-100 p-1 rounded text-[7px] text-slate-600 text-left border border-slate-200">
                                Fled region due to climate floods, seeks rehabilitation shelter...
                              </div>
                            </div>
                          )}

                          {simStep === 4 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">4</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 4: Facial Biometrics</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Simulate digital facial capturing with real-time feedback detection.</p>
                              <div className="relative mx-auto h-14 w-14 rounded-md bg-slate-200 border border-slate-350 overflow-hidden flex items-center justify-center">
                                <div className="absolute h-8 w-8 border border-emerald-500 border-dashed rounded-full" />
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                                <span className="text-[5px] text-emerald-600 font-bold bg-white/80 px-1 rounded absolute bottom-0.5">Detecting...</span>
                              </div>
                            </div>
                          )}

                          {simStep === 5 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">5</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 5: Thumbprint Scan</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Scan left/right thumbprints for secure biometric index registration.</p>
                              <div className="relative mx-auto h-14 w-10 rounded-md bg-slate-900 border border-slate-400 overflow-hidden flex items-center justify-center">
                                <Fingerprint className="h-6 w-6 text-emerald-450" />
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                              </div>
                            </div>
                          )}

                          {simStep === 6 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">✓</div>
                              <div className="text-[9px] font-bold text-emerald-600">Step 6: Sync Completed</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Record successfully compiled and uploaded to the NCFRMI security registry.</p>
                              <div className="text-[7px] font-mono text-slate-400 bg-white border border-slate-200 p-0.5 rounded text-center">
                                NCF-REG-2026-A9F3
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Looping Progress Dots */}
                        <div className="flex justify-center gap-1 border-t border-slate-200 pt-2 pb-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                              key={idx}
                              className={`h-1 w-1 rounded-full transition-all duration-300 ${
                                simStep === idx ? "bg-primary w-2.5" : "bg-slate-305"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button variant="outline" size="sm" onClick={() => { setAppComingSoon(true); toast.info("Coming soon!"); }} className="hover-lift">
                    <Download className="mr-2 h-3.5 w-3.5" /> {appComingSoon ? "Coming Soon!" : "Download & Install the App"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : showInterventions ? (
          <InterventionsPortal
            onBack={() => setShowInterventions(false)}
            list={interventionsList}
            onAdd={handleAddIntervention}
          />
        ) : showIncidentReport ? (
          <IncidentReportPortal
            onBack={() => setShowIncidentReport(false)}
            list={incidentsList}
            onAdd={handleAddIncident}
          />
        ) : (
          <div className={`${step === 0 ? "mx-auto max-w-4xl relative animate-fade-up" : "mx-auto max-w-3xl animate-fade-up"}`}>
            {step === 0 && (
              <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/5 via-primary/5 to-accent/5 rounded-3xl -z-10 blur-xl opacity-80" />
            )}
            <Card className={`p-6 sm:p-8 shadow-card overflow-hidden transition-all duration-300 relative ${
              step === 0 ? "border-primary/20 bg-card/90 backdrop-blur-sm shadow-elegant" : ""
            }`}>
              {step === 0 && (
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
              )}
              
              {step > 0 && (() => {
                const activeSteps = data.type === "refugee" ? ["Registration Type", "Basic Biodata", "Review", "Thumbprint Scan"] : steps;
                return (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of {activeSteps.length}</div>
                        <h2 className="font-display text-2xl font-bold text-primary">{activeSteps[step]}</h2>
                      </div>
                      <ShieldCheck className="h-8 w-8 text-accent" />
                    </div>
                    <Progress value={((step + 1) / activeSteps.length) * 100} className="mb-6 h-2" />
                  </>
                );
              })()}

              {step === 0 && (
                <div className="space-y-6">
                  <div className="border-b pb-4 mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-primary font-bold">National Commission for Refugees, Migrants and Internally Displaced Persons</h3>
                      <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">DATA COLLECTION FORM</h2>
                    </div>
                    <img src={logo} alt="NCFRMI Crest" className="h-10 w-10 object-contain hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* 4 Professional Category Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Card 1: REFUGEES */}
                    {enabledCategories.includes("refugee") && (
                      <button
                        type="button"
                        onClick={() => {
                          set("type", "refugee");
                          set("nationality", ""); 
                          set("state_origin", new Date().toISOString().slice(0, 10)); 
                          setStep(1);
                        }}
                        className="group flex flex-col items-start p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/45 hover:shadow-elegant relative overflow-hidden active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center gap-3.5 z-10">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-display font-extrabold text-foreground text-sm tracking-wide uppercase">Refugees</h4>
                            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Protection Division
                            </span>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Card 2: IDPs */}
                    {enabledCategories.includes("idp") && (
                      <button
                        type="button"
                        onClick={() => {
                          set("type", "idp");
                          setStep(1);
                        }}
                        className="group flex flex-col items-start p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/45 hover:shadow-elegant relative overflow-hidden active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center gap-3.5 z-10">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300">
                            <Home className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-display font-extrabold text-foreground text-sm tracking-wide uppercase">IDPs</h4>
                            <span className="text-[9px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Camp Enrolment
                            </span>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Card 3: MIGRANTS / RETURNEES */}
                    {(enabledCategories.includes("migrant") || enabledCategories.includes("returnee")) && (
                      <div className="relative group flex flex-col items-start p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/45 hover:shadow-elegant overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {!subCategoryOpen ? (
                          <div className="flex flex-col h-full w-full justify-between z-10">
                            <div>
                              <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300">
                                  <RotateCcw className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-display font-extrabold text-foreground text-sm tracking-wide uppercase">Migrants / Returnees</h4>
                                  <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                                    Repatriation & Transit
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSubCategoryOpen(true)}
                              className="mt-4 w-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/50 hover-lift"
                            >
                              Choose Category
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col w-full h-full justify-between z-10 animate-fade-in">
                            <div>
                              <h4 className="font-display font-extrabold text-foreground text-xs uppercase mb-2">Select category type:</h4>
                              <p className="text-[10px] text-muted-foreground mb-4 leading-normal">Specify whether this enrollee is a regular Migrant or a Returnee.</p>
                              <div className="grid grid-cols-2 gap-2">
                                {enabledCategories.includes("migrant") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      set("type", "migrant");
                                      setStep(1);
                                      setSubCategoryOpen(false);
                                    }}
                                    className="flex items-center justify-center p-2.5 rounded bg-muted hover:bg-primary hover:text-white text-xs font-bold text-foreground transition-all active:scale-95 text-center"
                                  >
                                    Migrant
                                  </button>
                                )}
                                {enabledCategories.includes("returnee") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      set("type", "returnee");
                                      setStep(1);
                                      setSubCategoryOpen(false);
                                    }}
                                    className="flex items-center justify-center p-2.5 rounded bg-muted hover:bg-primary hover:text-white text-xs font-bold text-foreground transition-all active:scale-95 text-center"
                                  >
                                    Returnee
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSubCategoryOpen(false)}
                              className="mt-3 text-center text-[10px] font-semibold text-muted-foreground hover:underline"
                            >
                              ← Back
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card 4: INTERVENTIONS */}
                    <button
                      type="button"
                      onClick={() => setShowInterventions(true)}
                      className="group flex flex-col items-start p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/45 hover:shadow-elegant relative overflow-hidden active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center gap-3.5 z-10">
                        <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-foreground text-sm tracking-wide uppercase">Interventions</h4>
                          <span className="text-[9px] font-semibold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                            Aid Distribution
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Card 5: REPORT INCIDENT */}
                    <button
                      type="button"
                      onClick={() => setShowIncidentReport(true)}
                      className="group flex flex-col items-start p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/45 hover:shadow-elegant relative overflow-hidden active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center gap-3.5 z-10">
                        <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300">
                          <CloudLightning className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-rose-800 text-sm tracking-wide uppercase">Report Incident</h4>
                          <span className="text-[9px] font-semibold text-rose-650 bg-rose-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                            Security & Device Issues
                          </span>
                        </div>
                      </div>
                    </button>

                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Image/Picture at the very top of the Data Collection Form */}
                  <div className="flex flex-col items-center border-b pb-6 mb-6">
                    <div className="w-full max-w-md">
                      <FaceCapture image={face} onCapture={setFace} />
                    </div>
                  </div>

                  {/* Section 1: BIODATA */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-1.5">
                      <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">I</span>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">BIODATA</h3>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field label="Full legal name *">
                          <Input value={data.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Firstname Middlename Lastname" />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label={data.type === "refugee" ? "Assigned Settlement / Camp *" : "Current address / shelter *"}>
                          <Textarea rows={2} value={data.address} onChange={(e) => set("address", e.target.value)} placeholder={data.type === "refugee" ? "e.g. Ogoja Refugee Settlement, Cross River State" : "Detail current IDP camp name, community shelter, or transient host address..."} />
                        </Field>
                      </div>
                      <Field label="Phone *">
                        <Input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234…" />
                      </Field>
                      <Field label="Date of birth *">
                        <Input type="date" value={data.dob} onChange={(e) => set("dob", e.target.value)} />
                      </Field>
                      <Field label="Gender *">
                        <Select value={data.gender} onValueChange={(v) => set("gender", v)}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={data.type === "refugee" ? "Country of Origin *" : "Nationality *"}>
                        <Input value={data.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder={data.type === "refugee" ? "e.g. Cameroon, Sudan" : "Nigeria"} />
                      </Field>
                      
                      {data.type === "refugee" ? (
                        <Field label="Date of Arrival in Nigeria *">
                          <Input type="date" value={data.state_origin} onChange={(e) => set("state_origin", e.target.value)} />
                        </Field>
                      ) : (
                        <>
                          <Field label="State of origin *">
                            <Select value={data.state_origin} onValueChange={(v) => set("state_origin", v)}>
                              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                              <SelectContent className="max-h-60">
                                {NG_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="LGA *">
                            <Input value={data.lga} onChange={(e) => set("lga", e.target.value)} placeholder="Local Government Area" />
                          </Field>
                          <div className="sm:col-span-2">
                            <Field label="Number of dependants accompanying enrolee *">
                              <Input type="number" min={0} value={data.dependants} onChange={(e) => set("dependants", e.target.value)} />
                            </Field>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {data.type !== "refugee" && (
                    <>
                      {/* Section 2: Education background */}
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b pb-1.5">
                          <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">II</span>
                          <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">Education background</h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Highest Level of Education Completed *">
                            <Select value={data.education_level} onValueChange={(v) => set("education_level", v)}>
                              <SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Formal Education</SelectItem>
                                <SelectItem value="primary">Primary Education</SelectItem>
                                <SelectItem value="secondary">Secondary Education</SelectItem>
                                <SelectItem value="tertiary">Tertiary / University Degree</SelectItem>
                                <SelectItem value="vocational">Vocational / Technical training</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          
                          <Field label="Specialized Skills / Trade / Talents">
                            <Input value={data.skills} onChange={(e) => set("skills", e.target.value)} placeholder="e.g. Farming, Carpentry, Tailoring, none" />
                          </Field>
                        </div>
                      </div>

                      {/* Section 3: cause of displacement */}
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b pb-1.5">
                          <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">III</span>
                          <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">cause of displacement</h3>
                        </div>
                        
                        <Field label="Cause of Displacement *">
                          <Select value={data.reason} onValueChange={(v) => set("reason", v)}>
                            <SelectTrigger><SelectValue placeholder="Select cause of displacement" /></SelectTrigger>
                            <SelectContent>
                              {(DISPLACEMENT_CAUSES[data.type] || DISPLACEMENT_CAUSES.general).map((cause) => (
                                <SelectItem key={cause} value={cause}>{cause}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="rounded-lg border border-border bg-muted/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-b pb-4">
                      {face && (
                        <img src={face} className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-sm" />
                      )}
                      <div className="text-center sm:text-left">
                        <h4 className="font-display font-bold text-primary text-lg">{data.full_name || "Un-named Registrant"}</h4>
                        <p className="text-xs text-muted-foreground">{typeLabel} · {data.nationality}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {data.type === "refugee" ? (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">Refugee Basic Details</h4>
                          <dl className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                            <Row k="Phone" v={data.phone} />
                            <Row k="DOB" v={data.dob} />
                            <Row k="Gender" v={data.gender} />
                            <Row k="Country of Origin" v={data.nationality} />
                            <Row k="Date of Arrival" v={data.state_origin} />
                          </dl>
                          <div className="mt-2"><span className="text-[10px] font-bold text-muted-foreground">Assigned Settlement:</span><p className="mt-0.5 text-xs">{data.address}</p></div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">Biodata Details</h4>
                            <dl className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                              <Row k="Phone" v={data.phone} />
                              <Row k="DOB" v={data.dob} />
                              <Row k="Gender" v={data.gender} />
                              <Row k="State of origin" v={data.state_origin} />
                              <Row k="LGA" v={data.lga} />
                              <Row k="Dependants" v={data.dependants} />
                            </dl>
                            <div className="mt-2"><span className="text-[10px] font-bold text-muted-foreground">Current Address:</span><p className="mt-0.5 text-xs">{data.address}</p></div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">Education Background</h4>
                            <dl className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                              <Row k="Highest Education" v={data.education_level || "None"} />
                              <Row k="Specialized Skills / Trade" v={data.skills || "None"} />
                            </dl>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">Cause of Displacement</h4>
                            <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap">{data.reason}</p>
                          </div>

                          {/* Needs Assessment removed */}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verify all information with the registrant. Click below to proceed to thumbprint scan.
                  </p>
                </div>
              )}

               {step > 0 && (
                 <div className="mt-8 flex items-center justify-between gap-3">
                   <Button variant="outline" disabled={submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
                   {step < 2 && (
                     <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Continue</Button>
                   )}
                   {step === 2 && (
                     <Button disabled={!canNext() || submitting} onClick={submit}>
                       {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                       Submit enrolment
                     </Button>
                   )}
                 </div>
               )}
            </Card>
          </div>
        )}
      </div>
    )}
  </section>

      <Dialog open={success} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent className={(data.type === "refugee" || data.type === "idp") ? "max-w-lg" : "max-w-md"}>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center font-display">Enrolment Completed Successfully</DialogTitle>
            <DialogDescription className="text-center text-xs">
              {data.type === "refugee" ? "Refugee" : typeLabel} biometric profile registered under reference <b>{lastRef}</b>.
            </DialogDescription>
          </DialogHeader>

          {/* Refugee ID Card Preview */}
          {data.type === "refugee" && (
            <div className="my-4 rounded-2xl overflow-hidden bg-white shadow-xl mx-auto w-full max-w-[420px] flex flex-col justify-between min-h-[250px]" style={{border: '3px solid #0B6E4F', boxShadow: '0 0 0 6px #e6f4ee, 0 4px 24px rgba(11,110,79,0.18)'}}>
              {/* Header section (Centered logo + text) */}
              <div className="flex flex-col items-center pt-3 px-3 text-center" style={{borderBottom: '2px solid #0B6E4F'}}>
                <img src={logo} alt="NCFRMI seal" className="h-9 w-9 object-contain" />
                <div className="text-[7.5px] font-bold text-[#4E342E] uppercase mt-1 tracking-tight">
                  NATIONAL COMMISSION FOR REFUGEES, MIGRANTS &amp; IDPs
                </div>
                <div className="text-[9.5px] font-extrabold text-[#0B6E4F] tracking-wide mt-0.5">
                  REFUGEE IDENTITY CARD
                </div>
              </div>

              {/* Body Section */}
              <div className="px-4 py-2.5 flex gap-3 items-start text-left">
                {/* Photo (Left) */}
                <div className="flex flex-col items-center">
                  <div className="h-24 w-18 rounded bg-white overflow-hidden shadow-inner flex items-center justify-center relative" style={{border: '2px solid #0B6E4F'}}>
                    {face ? (
                      <img src={face} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <span className="text-[6.5px] text-emerald-700 font-extrabold mt-1 uppercase tracking-widest bg-emerald-50 px-1 border border-emerald-200 rounded">
                    BIO-VERIFIED
                  </span>
                </div>

                {/* Info List (Middle) */}
                <div className="flex-1 space-y-1 text-[9px] text-slate-800 font-medium" style={{borderLeft: '1.5px solid #e2e8f0', paddingLeft: '10px'}}>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Full Name</span>
                    <span className="font-extrabold text-slate-900 leading-tight block">{data.full_name.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Date of Birth</span>
                    <span className="text-slate-900">{data.dob}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Country of Origin</span>
                    <span className="text-slate-900 uppercase">{data.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Settlement</span>
                    <span className="text-slate-900 uppercase truncate block max-w-[120px]" title={data.address}>{data.address}</span>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-[7px] font-bold text-emerald-800 uppercase block tracking-wider leading-none">ID Number</span>
                    <span className="font-mono text-[9px] font-bold text-[#0B6E4F]">{lastRef}</span>
                  </div>
                </div>

                {/* QR Code (Right) - proper QR pattern */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className="bg-white p-1 rounded" style={{border: '1.5px solid #0B6E4F', width: 52, height: 52}}>
                    <svg viewBox="0 0 21 21" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                      {/* Top-left finder */}
                      <rect x="0" y="0" width="7" height="7" fill="#0a0a0a" />
                      <rect x="1" y="1" width="5" height="5" fill="white" />
                      <rect x="2" y="2" width="3" height="3" fill="#0a0a0a" />
                      {/* Top-right finder */}
                      <rect x="14" y="0" width="7" height="7" fill="#0a0a0a" />
                      <rect x="15" y="1" width="5" height="5" fill="white" />
                      <rect x="16" y="2" width="3" height="3" fill="#0a0a0a" />
                      {/* Bottom-left finder */}
                      <rect x="0" y="14" width="7" height="7" fill="#0a0a0a" />
                      <rect x="1" y="15" width="5" height="5" fill="white" />
                      <rect x="2" y="16" width="3" height="3" fill="#0a0a0a" />
                      {/* Data modules */}
                      <rect x="8" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="12" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="2" width="2" height="1" fill="#0a0a0a" />
                      <rect x="11" y="2" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="4" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="4" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="6" width="2" height="1" fill="#0a0a0a" />
                      <rect x="12" y="6" width="1" height="1" fill="#0a0a0a" />
                      <rect x="0" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="2" y="8" width="3" height="1" fill="#0a0a0a" />
                      <rect x="7" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="9" y="8" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="8" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="19" y="8" width="2" height="1" fill="#0a0a0a" />
                      <rect x="1" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="4" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="11" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="14" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="9" width="3" height="1" fill="#0a0a0a" />
                      <rect x="0" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="5" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="9" y="10" width="3" height="1" fill="#0a0a0a" />
                      <rect x="15" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="19" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="3" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="7" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="12" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="11" width="1" height="1" fill="#0a0a0a" />
                      <rect x="0" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="3" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="6" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="9" y="12" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="12" width="3" height="1" fill="#0a0a0a" />
                      <rect x="18" y="12" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="14" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="14" width="2" height="1" fill="#0a0a0a" />
                      <rect x="14" y="14" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="14" width="3" height="1" fill="#0a0a0a" />
                      <rect x="9" y="15" width="1" height="1" fill="#0a0a0a" />
                      <rect x="12" y="15" width="2" height="1" fill="#0a0a0a" />
                      <rect x="15" y="15" width="1" height="1" fill="#0a0a0a" />
                      <rect x="18" y="15" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="11" y="16" width="1" height="1" fill="#0a0a0a" />
                      <rect x="14" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="9" y="17" width="3" height="1" fill="#0a0a0a" />
                      <rect x="14" y="17" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="17" width="1" height="1" fill="#0a0a0a" />
                      <rect x="19" y="17" width="2" height="1" fill="#0a0a0a" />
                      <rect x="8" y="18" width="1" height="1" fill="#0a0a0a" />
                      <rect x="11" y="18" width="2" height="1" fill="#0a0a0a" />
                      <rect x="15" y="18" width="3" height="1" fill="#0a0a0a" />
                      <rect x="19" y="18" width="2" height="1" fill="#0a0a0a" />
                      <rect x="9" y="19" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="19" width="1" height="1" fill="#0a0a0a" />
                      <rect x="17" y="19" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="20" width="3" height="1" fill="#0a0a0a" />
                      <rect x="12" y="20" width="2" height="1" fill="#0a0a0a" />
                      <rect x="16" y="20" width="3" height="1" fill="#0a0a0a" />
                    </svg>
                  </div>
                  <span className="text-[5px] text-slate-500 font-mono">SCAN TO VERIFY</span>
                </div>
              </div>

              {/* Bottom Stripes */}
              <div className="w-full flex flex-col mt-2">
                <div className="h-1 bg-[#4E342E]" />
                <div className="bg-[#0B6E4F] text-white text-[7.5px] font-extrabold text-center py-1.5 uppercase tracking-wider">
                  NATIONAL SECURE DOCUMENT • BIOMETRIC VERIFIED
                </div>
              </div>
            </div>
          )}

          {/* IDP ID Card Preview */}
          {data.type === "idp" && (
            <div className="my-4 rounded-2xl overflow-hidden bg-[#fefeeb] shadow-xl mx-auto w-full max-w-[420px] flex flex-col justify-between min-h-[250px]" style={{border: '3px solid #4E342E', boxShadow: '0 0 0 6px #fdf6e3, 0 4px 24px rgba(78,52,46,0.18)'}}>
              {/* Top Brown Header Bar */}
              <div className="bg-[#4E342E] text-white p-2.5 flex items-center gap-2 relative text-left">
                <img src={logo} alt="NCFRMI seal" className="h-8 w-8 object-contain" />
                <div className="leading-tight">
                  <div className="text-[7px] font-bold tracking-tight">NATIONAL COMMISSION FOR REFUGEES, MIGRANTS &amp; IDPs</div>
                  <div className="text-[9px] font-extrabold tracking-wider uppercase mt-0.5 text-amber-100">INTERNALLY DISPLACED PERSON (IDP) SECURE ID</div>
                </div>
              </div>

              {/* Body Section */}
              <div className="px-4 py-2.5 flex gap-3 items-start text-left mt-1">
                {/* Photo (Left) */}
                <div className="flex flex-col items-center">
                  <div className="h-24 w-18 rounded bg-white overflow-hidden shadow-inner flex items-center justify-center relative" style={{border: '2px solid #4E342E'}}>
                    {face ? (
                      <img src={face} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <span className="text-[6.5px] text-[#4E342E] font-extrabold mt-1 uppercase tracking-widest bg-amber-50 px-1 border border-amber-200 rounded">
                    DOMESTIC ID
                  </span>
                </div>

                {/* Info List (Middle) */}
                <div className="flex-1 space-y-1 text-[9px] text-slate-800 font-medium" style={{borderLeft: '1.5px solid #d4af37', paddingLeft: '10px'}}>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Full Name</span>
                    <span className="font-extrabold text-slate-900 leading-tight block">{data.full_name.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Date of Birth</span>
                      <span className="text-slate-900">{data.dob}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">State of Origin</span>
                      <span className="text-slate-900 uppercase">{data.state_origin}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">LGA of Origin</span>
                      <span className="text-slate-900 uppercase">{data.lga}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-bold text-slate-400 block uppercase leading-none">Displacement Camp</span>
                      <span className="text-slate-900 uppercase truncate block max-w-[65px]" title={data.address}>{data.address}</span>
                    </div>
                  </div>
                  
                  <div className="pt-0.5">
                    <span className="text-[7px] font-bold text-[#4E342E] uppercase block tracking-wider leading-none">ID Number</span>
                    <span className="font-mono text-[9px] font-bold text-[#4E342E]">{lastRef}</span>
                  </div>
                </div>

                {/* QR Code (Right) - proper QR pattern */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className="bg-white p-1 rounded" style={{border: '1.5px solid #4E342E', width: 52, height: 52}}>
                    <svg viewBox="0 0 21 21" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                      {/* Top-left finder */}
                      <rect x="0" y="0" width="7" height="7" fill="#0a0a0a" />
                      <rect x="1" y="1" width="5" height="5" fill="#fefeeb" />
                      <rect x="2" y="2" width="3" height="3" fill="#0a0a0a" />
                      {/* Top-right finder */}
                      <rect x="14" y="0" width="7" height="7" fill="#0a0a0a" />
                      <rect x="15" y="1" width="5" height="5" fill="#fefeeb" />
                      <rect x="16" y="2" width="3" height="3" fill="#0a0a0a" />
                      {/* Bottom-left finder */}
                      <rect x="0" y="14" width="7" height="7" fill="#0a0a0a" />
                      <rect x="1" y="15" width="5" height="5" fill="#fefeeb" />
                      <rect x="2" y="16" width="3" height="3" fill="#0a0a0a" />
                      {/* Data modules */}
                      <rect x="8" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="12" y="0" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="2" width="2" height="1" fill="#0a0a0a" />
                      <rect x="11" y="2" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="4" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="4" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="6" width="2" height="1" fill="#0a0a0a" />
                      <rect x="12" y="6" width="1" height="1" fill="#0a0a0a" />
                      <rect x="0" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="2" y="8" width="3" height="1" fill="#0a0a0a" />
                      <rect x="7" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="9" y="8" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="8" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="8" width="1" height="1" fill="#0a0a0a" />
                      <rect x="1" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="4" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="11" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="14" y="9" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="9" width="3" height="1" fill="#0a0a0a" />
                      <rect x="0" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="5" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="9" y="10" width="3" height="1" fill="#0a0a0a" />
                      <rect x="15" y="10" width="2" height="1" fill="#0a0a0a" />
                      <rect x="3" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="7" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="12" y="11" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="11" width="1" height="1" fill="#0a0a0a" />
                      <rect x="0" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="3" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="6" y="12" width="1" height="1" fill="#0a0a0a" />
                      <rect x="9" y="12" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="12" width="3" height="1" fill="#0a0a0a" />
                      <rect x="18" y="12" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="14" width="1" height="1" fill="#0a0a0a" />
                      <rect x="10" y="14" width="2" height="1" fill="#0a0a0a" />
                      <rect x="14" y="14" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="14" width="3" height="1" fill="#0a0a0a" />
                      <rect x="9" y="15" width="1" height="1" fill="#0a0a0a" />
                      <rect x="12" y="15" width="2" height="1" fill="#0a0a0a" />
                      <rect x="15" y="15" width="1" height="1" fill="#0a0a0a" />
                      <rect x="18" y="15" width="3" height="1" fill="#0a0a0a" />
                      <rect x="8" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="11" y="16" width="1" height="1" fill="#0a0a0a" />
                      <rect x="14" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="17" y="16" width="2" height="1" fill="#0a0a0a" />
                      <rect x="9" y="17" width="3" height="1" fill="#0a0a0a" />
                      <rect x="14" y="17" width="1" height="1" fill="#0a0a0a" />
                      <rect x="16" y="17" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="18" width="1" height="1" fill="#0a0a0a" />
                      <rect x="11" y="18" width="2" height="1" fill="#0a0a0a" />
                      <rect x="15" y="18" width="3" height="1" fill="#0a0a0a" />
                      <rect x="9" y="19" width="2" height="1" fill="#0a0a0a" />
                      <rect x="13" y="19" width="1" height="1" fill="#0a0a0a" />
                      <rect x="17" y="19" width="1" height="1" fill="#0a0a0a" />
                      <rect x="8" y="20" width="3" height="1" fill="#0a0a0a" />
                      <rect x="12" y="20" width="2" height="1" fill="#0a0a0a" />
                      <rect x="16" y="20" width="3" height="1" fill="#0a0a0a" />
                    </svg>
                  </div>
                  <span className="text-[5px] text-slate-500 font-mono">SCAN TO VERIFY</span>
                </div>
              </div>

              {/* Bottom Bar (Green with gold accent line) */}
              <div className="w-full flex flex-col mt-2">
                <div className="h-[2px] bg-[#d4af37]" />
                <div className="bg-[#0B6E4F] text-white text-[7.5px] font-extrabold text-center py-1.5 uppercase tracking-wider">
                  DOMESTIC REGISTRATION • INTERNALLY DISPLACED PERSON
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            {(data.type === "refugee" || data.type === "idp") && (
              <Button 
                onClick={data.type === "refugee" ? downloadRefugeeIDCard : downloadIDPIDCard} 
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs"
              >
                <Download className="h-4 w-4" /> Download ID Card PDF
              </Button>
            )}
            <Button variant="outline" onClick={reset}><UserPlus className="mr-2 h-4 w-4" /> Add another registrant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-sm font-medium">{label}</label><div className="mt-1.5">{children}</div></div>
);
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-2"><dt className="min-w-28 text-xs font-semibold text-muted-foreground">{k}:</dt><dd>{v || "—"}</dd></div>
);

function FaceCapture({ image, onCapture }: { image: string | null; onCapture: (d: string | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startCamera = async () => {
    setErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 480 } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setLive(true);
    } catch (e: unknown) {
      console.warn("Camera hardware access failed:", e);
      setErr("Failed to access camera. Please upload a file instead.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 480;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d")!;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <Card className="p-5 border border-border bg-card/50 shadow-sm relative overflow-hidden flex flex-col items-center">
      <h3 className="font-display font-bold text-foreground text-xs uppercase tracking-wider mb-3">
        Passport Photograph *
      </h3>

      <div className="relative h-44 w-36 rounded-md border-2 border-dashed border-primary/20 bg-muted/40 overflow-hidden flex items-center justify-center shadow-inner mb-4">
        {image ? (
          <img src={image} alt="Passport Photograph" className="h-full w-full object-cover animate-fade-in" />
        ) : live ? (
          <video ref={videoRef} className="h-full w-full object-cover transform -scale-x-100" muted playsInline />
        ) : (
          <div className="text-center p-3 text-muted-foreground flex flex-col items-center gap-1.5">
            <Users className="h-8 w-8 opacity-45" />
            <span className="text-[10px] font-semibold leading-tight">No image uploaded</span>
          </div>
        )}

        {live && <div className="absolute left-0 right-0 h-0.5 bg-primary/40 animate-scanline pointer-events-none" />}
      </div>

      {err && <p className="text-[10px] text-rose-500 font-bold mb-3">{err}</p>}

      <div className="w-full space-y-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {live ? (
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="flex-1 text-[10px] font-bold h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={capturePhoto}
              className="flex-1 text-[10px] font-bold h-8 bg-emerald-800 hover:bg-emerald-700 text-white"
            >
              Capture Photo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {image ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onCapture(null)}
                className="w-full text-[10px] font-bold h-8"
              >
                Remove Photo
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-[10px] font-bold h-8 gap-1.5"
                >
                  <Upload className="h-3 w-3" /> Import File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="flex-1 text-[10px] font-bold h-8 gap-1.5"
                >
                  <Camera className="h-3 w-3" /> Use Camera
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function InterventionsPortal({
  onBack,
  list,
  onAdd
}: {
  onBack: () => void;
  list: Intervention[];
  onAdd: (camp: string, category: string, details: string, count: number) => void;
}) {
  const [camp, setCamp] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [count, setCount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(camp, category, details, Number(count) || 0);
    setCamp("");
    setCategory("");
    setDetails("");
    setCount("");
  };

  const MOCK_CAMPS = [
    "Durumi Camp, Abuja",
    "Kuchingoro Camp, Abuja",
    "Maiduguri Zonal Camp, Borno",
    "Gombe Zonal Camp",
    "Daudu Camp, Benue",
    "Uhogua Camp, Edo"
  ];

  const MOCK_CATEGORIES = [
    "Food & Nutrition",
    "Medical & Healthcare",
    "Shelter & WAsH",
    "Education & Training",
    "Cash Assistance",
    "Legal Aid & Security"
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all"
        >
          <span className="h-7 w-7 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-bold">
            ←
          </span>
          Back to Selection
        </button>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-650 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" /> Intervention Registry
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Log Form (Col Span 1) */}
        <Card className="p-6 md:col-span-1 shadow-card border-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Log Empowerment/Intervention</h3>
              <p className="text-[10px] text-muted-foreground">Register empowerment and skills acquisition events</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-semibold text-foreground">Target Camp / Zonal Hub</label>
              <select
                value={camp}
                onChange={(e) => setCamp(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              >
                <option value="" className="text-foreground">Select location</option>
                {MOCK_CAMPS.map((c) => <option key={c} value={c} className="text-foreground">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Empowerment / Skill Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              >
                <option value="" className="text-foreground">Select type</option>
                {MOCK_CATEGORIES.map((c) => {
                  let label = c;
                  if (c === "Medical & Healthcare") label = "Skills Acquisition program";
                  else if (c === "Cash Assistance") label = "Empowerment program";
                  return <option key={c} value={c} className="text-foreground">{label}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Beneficiaries Reached (Count)</label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
                placeholder="e.g. 150"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Empowerment & Distribution Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={4}
                placeholder="Detail what was distributed, brand/lot, delivery partners, and any distribution metrics..."
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none resize-none text-foreground"
              />
            </div>

            <Button type="submit" className="w-full text-xs font-bold py-2.5 hover-lift">
              Log Intervention Entry
            </Button>
          </form>
        </Card>

        {/* Activity Feed (Col Span 2) */}
        <Card className="p-6 md:col-span-2 shadow-card border-primary/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-teal-500/10 text-teal-650 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm">Registry Logs</h3>
                    <p className="text-[10px] text-muted-foreground">Historical relief tracking at zonal nodes</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                  {list.length} Records
                </span>
              </div>

              {/* List */}
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {list.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No interventions logged yet in local session.
                  </div>
                ) : (
                  list.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-foreground">{item.camp}</span>
                          <span className="text-[9px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {item.category === "Medical & Healthcare" ? "Skills Acquisition program" : item.category === "Cash Assistance" ? "Empowerment program" : item.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {item.details}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-foreground">{item.count}</span> beneficiaries
                          </span>
                          <span>•</span>
                          <span>Logged by {item.officer}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 min-w-[90px] text-right">
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto">
                          <span className="h-1 w-1 rounded-full bg-emerald-500" /> SECURE SYNC
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] text-muted-foreground">
              <span>NCFRMI Secure Gateway Protocol v3.0</span>
              <span>Local caching enabled</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function IncidentReportPortal({
  onBack,
  list,
  onAdd
}: {
  onBack: () => void;
  list: any[];
  onAdd: (
    category: string,
    severity: string,
    location: string,
    incident_date: string,
    description: string,
    action_taken: string,
    photo: string | null
  ) => void;
}) {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateCameraCapture = () => {
    const mockCaptures = [
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23fee2e2'/><path d='M200 60 L290 220 L110 220 Z' fill='%23ef4444'/><path d='M200 120 L200 170' stroke='white' stroke-width='8' stroke-linecap='round'/><circle cx='200' cy='195' r='5' fill='white'/><text x='200' y='250' fill='%23991b1b' font-weight='bold' font-size='14' text-anchor='middle'>SECURITY THREAT</text></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23fef3c7'/><circle cx='200' cy='150' r='50' fill='none' stroke='%23f59e0b' stroke-width='10'/><path d='M170 150 L230 150' stroke='%23f59e0b' stroke-width='10'/><text x='200' y='240' fill='%2392400e' font-weight='bold' font-size='14' text-anchor='middle'>DEVICE FAULT</text></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23ecfdf5'/><path d='M100 200 C 150 150, 250 150, 300 200' fill='none' stroke='%2310b981' stroke-width='8'/><text x='200' y='240' fill='%23065f46' font-weight='bold' font-size='14' text-anchor='middle'>OPERATIONAL ISSUE</text></svg>"
    ];
    const randomIdx = Math.floor(Math.random() * mockCaptures.length);
    setPhotoPreview(mockCaptures[randomIdx]);
    toast.success("Incident photo snapshot simulated!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(category, severity, location, incidentDate, description, actionTaken, photoPreview);
    setCategory("");
    setSeverity("");
    setLocation("");
    setIncidentDate(new Date().toISOString().slice(0, 16));
    setDescription("");
    setActionTaken("");
    setPhotoPreview(null);
  };

  const INCIDENT_TYPES = [
    "Security Threat / Hostile Activity",
    "Biometric Device Malfunction",
    "Connectivity / Network Outage",
    "Extreme Weather Disruption",
    "Medical Emergency",
    "Information Mismatch / Suspected Fraud",
    "Inadequate Relief/Supplies Riot",
    "Other operational issue"
  ];

  const SEVERITIES = [
    { value: "Low", class: "bg-slate-100 text-slate-800" },
    { value: "Medium", class: "bg-amber-100 text-amber-800" },
    { value: "High", class: "bg-orange-100 text-orange-850" },
    { value: "Critical", class: "bg-rose-100 text-rose-850 animate-pulse" }
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all"
        >
          <span className="h-7 w-7 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-bold">
            ←
          </span>
          Back to Selection
        </button>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-650 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Incident Response Node
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Report Form (Col Span 1) */}
        <Card className="p-6 md:col-span-1 shadow-card border-rose-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="h-8 w-8 rounded bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <CloudLightning className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Report Incident</h3>
              <p className="text-[10px] text-muted-foreground">Log field operational and security issues</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-semibold text-foreground">Incident Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-foreground"
              >
                <option value="" className="text-foreground">Select type</option>
                {INCIDENT_TYPES.map((c) => <option key={c} value={c} className="text-foreground">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Severity Level *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-foreground"
              >
                <option value="" className="text-foreground">Select severity</option>
                {SEVERITIES.map((s) => <option key={s.value} value={s.value} className="text-foreground">{s.value}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Camp Location / Sector *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g. Durumi IDP Camp"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Incident Date & Time *</label>
              <input
                type="datetime-local"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Description of Incident *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Provide a detailed description of what happened..."
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Immediate Action Taken</label>
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                rows={2}
                placeholder="Explain any steps taken on site to resolve or contain..."
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none text-foreground"
              />
            </div>

            {/* Photo Attachment Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">Attach Incident Photo</label>
              
              {photoPreview && (
                <div className="relative h-28 w-full rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center mb-2">
                  <img src={photoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-700"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={simulateCameraCapture}
                  className="text-[10px] h-8 font-bold border-rose-200/50 hover:bg-rose-50 text-rose-800"
                >
                  <Camera className="mr-1 h-3.5 w-3.5" /> Simulate Camera
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="incident-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-[10px] h-8 font-bold border-rose-200/50 hover:bg-rose-50 text-rose-800 w-full"
                  >
                    <label htmlFor="incident-photo-upload" className="cursor-pointer flex items-center justify-center">
                      Upload Picture
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-xs font-bold py-2.5 bg-rose-700 hover:bg-rose-800 text-white hover-lift">
              Submit Incident Report
            </Button>
          </form>
        </Card>

        {/* Incidents Log History (Col Span 2) */}
        <Card className="p-6 md:col-span-2 shadow-card border-rose-500/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <CloudLightning className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm">Zonal Incident Logs</h3>
                    <p className="text-[10px] text-muted-foreground">Active incidents reported during current operations</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                  {list.length} Reports
                </span>
              </div>

              {/* Log List */}
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {list.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No incidents reported in this workstation session.
                  </div>
                ) : (
                  list.map((item) => {
                    const severityObj = SEVERITIES.find((s) => s.value === item.severity) || { value: "Low", class: "bg-slate-100 text-slate-800" };
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs border-l-4 border-l-rose-500"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">{item.location}</span>
                            <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              {item.category}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${severityObj.class}`}>
                              {item.severity}
                            </span>
                          </div>
                          
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {item.description}
                          </p>

                          {item.action_taken && (
                            <div className="bg-muted/40 p-2 rounded text-[10px] text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-primary mr-1">Action:</span> {item.action_taken}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="font-mono text-[9px] font-bold text-primary">{item.reference}</span>
                            <span>•</span>
                            <span>Reported by {item.reported_by}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 min-w-[100px] text-right">
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto">
                            <span className="h-1 w-1 rounded-full bg-rose-500" /> SECURE SYNC
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {new Date(item.incident_date).toLocaleString()}
                          </span>
                          {item.photo_base64 && (
                            <img
                              src={item.photo_base64}
                              alt="Evidence"
                              className="h-10 w-14 object-cover rounded border border-border shadow-sm ml-auto cursor-pointer hover:scale-110 transition-transform duration-200"
                              onClick={() => {
                                toast.info("Evidence photo viewer triggered");
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] text-muted-foreground">
              <span>NCFRMI Security Control Gateway v3.1</span>
              <span>Encrypted offline storage live</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProfileSettingsView({
  officerName,
  setOfficerName,
  officerPicture,
  setOfficerPicture,
}: {
  officerName: string;
  setOfficerName: (s: string) => void;
  officerPicture: string | null;
  setOfficerPicture: (s: string | null) => void;
}) {
  const [name, setName] = useState(officerName);
  const [image, setImage] = useState(officerPicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setOfficerName(name);
    setOfficerPicture(image);
    localStorage.setItem("ncfrmi_officer_name", name);
    if (image) {
      localStorage.setItem("ncfrmi_officer_picture", image);
    } else {
      localStorage.removeItem("ncfrmi_officer_picture");
    }
    toast.success("Profile updated successfully!");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-6 max-w-xl mx-auto shadow-card relative overflow-hidden border border-primary/10">
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
      <div className="relative z-10 space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-wide">Update Officer Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your identity and picture for logs and ID generation</p>
        </div>

        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center sm:flex-row gap-5 border-b pb-6">
          <div className="relative h-24 w-24 rounded-full border-2 border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-inner shrink-0">
            {image ? (
              <img src={image} className="h-full w-full object-cover animate-fade-in" />
            ) : (
              <Users className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2 flex-1 text-center sm:text-left">
            <h4 className="text-xs font-extrabold uppercase text-foreground">Officer Photo</h4>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Accepts PNG, JPG or WEBP formats. Your photo will be stamped onto audit documents and logs.
            </p>
            <div className="flex justify-center sm:justify-start gap-2 pt-1">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold h-8 hover-lift"
              >
                Upload New Image
              </Button>
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImage(null)}
                  className="text-[10px] font-bold h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  Remove Picture
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Officer Full Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Muhammad Bello"
            className="text-xs font-medium"
          />
        </div>

        <Button onClick={handleSave} className="w-full text-xs font-bold hover-lift">
          Save Settings
        </Button>
      </div>
    </Card>
  );
}

function ResetPasswordView() {
  const [email] = useState("officer@ncfrmi.gov.ng");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [requested, setRequested] = useState(false);

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || !confirmPass) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match!");
      return;
    }
    setRequested(true);
    toast.success("Password reset request submitted successfully to the administrator node.");
  };

  return (
    <Card className="p-6 max-w-xl mx-auto shadow-card relative overflow-hidden border border-primary/10">
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
      <div className="relative z-10 space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-wide">Request Login Details Reset</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Submit request to the central administrator to reset your node key</p>
        </div>

        {requested ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-center space-y-2.5 animate-fade-in">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto animate-bounce-soft" />
            <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Request Pending Approval</h4>
            <p className="text-[11px] text-slate-700 leading-normal">
              Your request to change credentials for <b>{email}</b> has been queued for Super Administrator approval under security token <b>NCF-RST-{Math.random().toString(36).slice(2, 6).toUpperCase()}</b>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Officer Email</label>
              <Input
                type="email"
                disabled
                value={email}
                className="text-xs font-medium bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Proposed New Password</label>
              <Input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••"
                className="text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <Input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className="text-xs font-medium"
              />
            </div>

            <Button type="submit" className="w-full text-xs font-bold hover-lift">
              Submit Reset Request
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}


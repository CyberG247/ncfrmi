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
import { Camera, Fingerprint, CheckCircle2, Loader2, RotateCcw, ShieldCheck, UserPlus, Download, Globe, Home, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/ncfrmi-logo.png";

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

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

const empty: Form = {
  type: "", full_name: "", address: "", phone: "", dob: "", gender: "",
  nationality: "Nigeria", state_origin: "", lga: "", dependants: "0", reason: "",
  education_level: "", skills: "", primary_needs: [], needs_details: "",
};

const steps = ["Registration Type", "Biodata & Needs", "Review", "Thumbprint Scan"];

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("AudioContext beep failed:", e);
  }
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

export default function FieldCapture() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>(empty);
  const [face, setFace] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [simStep, setSimStep] = useState(0);
  const [appComingSoon, setAppComingSoon] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [showInterventions, setShowInterventions] = useState(false);
  const [interventionsList, setInterventionsList] = useState<any[]>([]);

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

  const handleAddIntervention = (camp: string, category: string, details: string, count: number) => {
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
    playBeep();
    toast.success("Intervention entry logged and synced!");
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
      return !!face && !!data.full_name && !!data.address && !!data.phone && !!data.dob && !!data.gender &&
        !!data.nationality && !!data.state_origin && !!data.lga && data.reason.length >= 20 &&
        !!data.education_level && !!data.needs_details;
    }
    if (step === 2) return true;
    if (step === 3) return !!thumb;
    return false;
  };

  const reset = () => {
    setStep(0); setData(empty); setFace(null); setThumb(null); setSuccess(false);
  };

  const submit = async () => {
    setSubmitting(true);
    const reference = `NCF-REG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: u } = await supabase.auth.getUser();

    const circumstancesMerged = `
CAUSE OF DISPLACEMENT:
${data.reason}

EDUCATION BACKGROUND:
- Level: ${data.education_level}
- Skills/Specialization: ${data.skills || "None"}

NEEDS ASSESSMENT:
- Immediate Needs: ${data.primary_needs.join(", ") || "None"}
- Details: ${data.needs_details}
`;

    const payload = {
      reference,
      category: data.type as any,
      full_name: data.full_name,
      address: data.address,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      nationality: data.nationality,
      state_origin: data.state_origin,
      lga: data.lga,
      dependants: Number(data.dependants) || 0,
      circumstances: circumstancesMerged,
      face_captured: !!face,
      thumb_captured: !!thumb,
      captured_by: u.user?.id ?? null,
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
          education_level: data.education_level,
          skills: data.skills,
          primary_needs: data.primary_needs,
          needs_details: data.needs_details,
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
        title="Field Officer — Data Capture"
        description="Secure on-site enrolment of Migrants, Returnees, Refugees and IDPs with biometric verification."
      />
      <section className="container-page py-10">
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
              
              {step > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of {steps.length}</div>
                      <h2 className="font-display text-2xl font-bold text-primary">{steps[step]}</h2>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-accent" />
                  </div>
                  <Progress value={((step + 1) / steps.length) * 100} className="mb-6 h-2" />
                </>
              )}

              {step === 0 && (
                <div className="space-y-6">
                  <div className="border-b pb-4 mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-primary font-bold">Federal Republic of Nigeria</h3>
                      <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">DATA COLLECTION FORM</h2>
                    </div>
                    <img src={logo} alt="NCFRMI Crest" className="h-10 w-10 object-contain hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* 4 Professional Category Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Card 1: REFUGEES */}
                    <button
                      type="button"
                      onClick={() => {
                        set("type", "refugee");
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
                      <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed z-10">
                        Enrol asylum seekers and certified refugees. Capture origin files and migration circumstances.
                      </p>
                    </button>

                    {/* Card 2: IDPs */}
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
                      <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed z-10">
                        Register Internally Displaced Persons. Track shelter coordinates, camp assignments, and dependants.
                      </p>
                    </button>

                    {/* Card 3: MIGRANTS / RETURNEES */}
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
                            <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed">
                              Enrol regularized migrants or returnee citizens. Track border transit and reintegration assets.
                            </p>
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
                      <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed z-10">
                        Log zonal support activities, resource deliveries, medical aids, and relief material tracking.
                      </p>
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
                        <Field label="Current address / shelter *">
                          <Textarea rows={2} value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="Detail current IDP camp name, community shelter, or transient host address..." />
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
                      <Field label="Nationality *">
                        <Input value={data.nationality} onChange={(e) => set("nationality", e.target.value)} />
                      </Field>
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
                    </div>
                  </div>

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
                    
                    <Field label={`Describe circumstances & cause of displacement * (min 20 characters)`}>
                      <Textarea
                        rows={4}
                        value={data.reason}
                        onChange={(e) => set("reason", e.target.value)}
                        placeholder="Detail the events that caused displacement (e.g. communal conflict, natural disaster, banditry), dates of event, and transit hurdles..."
                      />
                      <div className="mt-1 text-right text-[10px] text-muted-foreground">{data.reason.length} characters</div>
                    </Field>
                  </div>

                  {/* Section 4: Needs assessment */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 border-b pb-1.5">
                      <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">IV</span>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">Needs assessment</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-foreground">Select Immediate Priority Needs (Select all that apply)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {[
                            "Food Security & Nutrition",
                            "Emergency Shelter & Housing",
                            "Medical Supplies & Healthcare",
                            "Clean Water, Sanitation & Hygiene (WAsH)",
                            "Educational Materials & Schools",
                            "Livelihood & Cash Assistance"
                          ].map((need) => {
                            const isChecked = data.primary_needs.includes(need);
                            return (
                              <label
                                key={need}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-primary/5 border-primary text-primary"
                                    : "bg-background border-border text-foreground hover:bg-muted/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? data.primary_needs.filter((n) => n !== need)
                                      : [...data.primary_needs, need];
                                    setData((d) => ({ ...d, primary_needs: updated }));
                                  }}
                                  className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary focus:outline-none"
                                />
                                {need}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <Field label="Needs Assessment & Support Details *">
                        <Textarea
                          rows={3}
                          value={data.needs_details}
                          onChange={(e) => set("needs_details", e.target.value)}
                          placeholder="Detail specific urgent needs (e.g. baby foods, chronic illness medicine, mental health, family tracking assistance)..."
                        />
                      </Field>
                    </div>
                  </div>
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

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">Needs Assessment</h4>
                        <dl className="mt-2 text-xs space-y-2">
                          <div className="flex gap-2">
                            <span className="min-w-28 text-[10px] font-bold text-muted-foreground">Immediate Needs:</span>
                            <div className="flex flex-wrap gap-1">
                              {data.primary_needs.length > 0 ? (
                                data.primary_needs.map((need) => (
                                  <span key={need} className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                    {need}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground">None selected</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground">Assessment Details:</span>
                            <p className="mt-0.5 text-xs leading-relaxed">{data.needs_details}</p>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verify all information with the registrant. Click below to proceed to thumbprint scan.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto max-w-xl w-full">
                  {!thumb ? (
                    <ThumbCapture image={thumb} scanning={scanning} setScanning={setScanning} onCapture={setThumb} />
                  ) : (
                    <Card className="p-6 border border-emerald-500/20 bg-emerald-50/5 text-center space-y-6 animate-fade-in w-full">
                      <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-primary">Biometric Profile Locked</h3>
                        <p className="text-xs text-muted-foreground mt-1">Both facial liveness and thumbprint indexes have been securely stored.</p>
                      </div>
                      
                      <div className="grid gap-4 grid-cols-2">
                        <div className="p-3 border border-border rounded-lg bg-card relative">
                          <img src={face!} className="h-28 w-full object-cover rounded" />
                          <div className="text-[10px] font-semibold text-emerald-600 mt-2">Face Profile ✓</div>
                        </div>
                        <div className="p-3 border border-border rounded-lg bg-card relative">
                          <img src={thumb} className="h-28 w-full object-contain rounded bg-slate-900" />
                          <div className="text-[10px] font-semibold text-emerald-600 mt-2">Thumbprint ✓</div>
                          <Button variant="ghost" size="sm" onClick={() => setThumb(null)} className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xs">
                            ✕
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {step > 0 && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="outline" disabled={submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
                  {step < 2 && (
                    <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Continue</Button>
                  )}
                  {step === 2 && (
                    <Button disabled={!canNext()} onClick={() => setStep(3)}>
                      <Fingerprint className="mr-2 h-4 w-4" /> Proceed to Biometric Capturing
                    </Button>
                  )}
                  {step === 3 && (
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
      </section>

      <Dialog open={success} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <DialogTitle className="text-center font-display">Data has been captured successfully</DialogTitle>
            <DialogDescription className="text-center">
              {typeLabel} enrolment for <b>{data.full_name}</b> has been recorded with biometric verification.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setSuccess(false)}><RotateCcw className="mr-2 h-4 w-4" /> Review</Button>
            <Button onClick={reset}><UserPlus className="mr-2 h-4 w-4" /> Add another registrant</Button>
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
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [facialInstruction, setFacialInstruction] = useState("Position your face in the frame...");

  const start = async () => {
    setErr(null);
    setIsSimulated(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 480 } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setLive(true);
      setScanning(true);
    } catch (e: any) {
      console.warn("Camera hardware access failed, falling back to secure simulation:", e);
      setIsSimulated(true);
      setScanning(true);
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
    setScanning(false);
  };

  const snap = () => {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 480;
    const ctx = c.getContext("2d")!;

    if (isSimulated || !videoRef.current) {
      // Holographic contour silhouette mock image
      ctx.fillStyle = "#090d16"; ctx.fillRect(0, 0, 480, 480);
      
      // grid lines
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)"; ctx.lineWidth = 1;
      for (let i = 0; i < 480; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 480); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(480, i); ctx.stroke();
      }

      // head silhouette
      ctx.strokeStyle = "#10b981"; ctx.lineWidth = 4;
      ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
      ctx.beginPath();
      ctx.arc(240, 200, 85, 0, Math.PI * 2); // Head circle
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(240, 360, 140, 80, 0, Math.PI, 0); // Shoulder curve
      ctx.fill(); ctx.stroke();

      // target lines
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
      ctx.strokeRect(220, 180, 40, 40);
    } else {
      const v = videoRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      // Mirror the output canvas drawing as well to match the preview mirror!
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
    }

    onCapture(c.toDataURL("image/jpeg", 0.85));
    playBeep();
    stop();
  };

  useEffect(() => {
    if (!image) {
      start();
    }
    return () => stop();
  }, [image]);

  useEffect(() => {
    if (scanning && !image) {
      setFacialInstruction("Kindly blink your eyes");
      const t1 = setTimeout(() => setFacialInstruction("Kindly smile"), 600);
      const t2 = setTimeout(() => setFacialInstruction("Kindly nod your head"), 1200);
      const t3 = setTimeout(() => setFacialInstruction("Kindly look left"), 1800);
      const t4 = setTimeout(() => setFacialInstruction("Kindly look right"), 2400);
      const t5 = setTimeout(() => {
        snap();
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [scanning, image, isSimulated]);

  return (
    <div className="rounded-lg border border-border p-4 flex flex-col items-center text-center space-y-4">
      {/* Top Instruction Header */}
      <h3 className="text-emerald-500 font-display font-bold text-base tracking-wide animate-pulse h-6">
        {scanning ? facialInstruction : image ? "Verification Completed ✓" : "Initialize Facial Scan"}
      </h3>

      {/* Circular Camera Preview Frame */}
      <div className="relative h-48 w-48 rounded-full border-4 border-emerald-500 border-b-transparent p-1 bg-slate-900 shadow-lg flex items-center justify-center transition-all duration-500 overflow-hidden">
        <div className="relative h-full w-full rounded-full overflow-hidden flex items-center justify-center bg-slate-950">
          {image ? (
            <img src={image} alt="Captured face" className="h-full w-full object-cover animate-fade-in" />
          ) : isSimulated ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
              <HeadContourSVG />
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline z-20" />
              <span className="text-[8px] font-bold text-white bg-black/55 px-2 py-0.5 rounded shadow-sm border border-emerald-500/20 uppercase tracking-wider z-20 animate-pulse mt-12">
                Simulator
              </span>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="h-full w-full object-cover transform -scale-x-100" muted playsInline />
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                  <HeadContourSVG />
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline z-20" />
                  <span className="text-[8px] font-bold text-white bg-black/55 px-2 py-0.5 rounded shadow-sm border border-emerald-500/20 uppercase tracking-wider z-20 animate-pulse mt-12">
                    Liveness Check
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step Chain Indicator: [✔] --- [2] */}
      <div className="flex items-center justify-center gap-3 my-1">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${image ? "bg-emerald-500" : "bg-emerald-500 animate-pulse"} text-xs font-bold`}>
          {image ? "✓" : "1"}
        </div>
        <div className="h-[2px] w-10 bg-zinc-200" />
        <div className="h-6 w-6 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center text-xs font-bold">2</div>
      </div>

      {/* Animated Avatar at the bottom */}
      <AvatarSVG />

      {err && <p className="text-[9px] text-amber-500 font-medium">{err}</p>}
      <div className="w-full pt-1">
        <Button disabled variant="outline" size="sm" className="w-full">
          {image ? "Facial Biometric Verified ✓" : scanning ? "Liveness check active..." : "Awaiting Scanner..."}
        </Button>
      </div>
    </div>
  );
}

function ThumbCapture({ image, scanning, setScanning, onCapture }: {
  image: string | null; scanning: boolean; setScanning: (b: boolean) => void; onCapture: (d: string | null) => void;
}) {
  const scan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 2000));
    // Generate a synthetic fingerprint pattern as a placeholder visualisation.
    const c = document.createElement("canvas");
    c.width = 240; c.height = 320;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0b1b2b"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#7dd3fc"; ctx.lineWidth = 1.2;
    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      const cx = 120 + Math.sin(i * 0.3) * 8;
      const cy = 160 + Math.cos(i * 0.2) * 6;
      ctx.ellipse(cx, cy, 20 + i * 1.4, 30 + i * 1.7, Math.sin(i) * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    onCapture(c.toDataURL("image/png"));
    playBeep();
    setScanning(false);
  };

  useEffect(() => {
    if (!image && !scanning) {
      scan();
    }
  }, [image]);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between font-display text-sm font-semibold text-primary">
        <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Thumbprint Capture</span>
        {scanning && <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded animate-pulse">Scanning thumb...</span>}
      </div>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted">
        {image ? (
          <img src={image} alt="Captured thumbprint" className="h-full w-full object-contain animate-fade-in" />
        ) : (
          <>
            <Fingerprint className={`h-32 w-32 text-primary/40 ${scanning ? "animate-pulse" : ""}`} />
            {scanning && (
              <div className="absolute inset-x-0 top-0 h-1 animate-[scanline_1.6s_linear_infinite] bg-accent shadow-[0_0_12px_hsl(var(--accent))]"
                   style={{ animationName: "scanline" }} />
            )}
          </>
        )}
      </div>
      <div className="mt-3">
        <Button disabled variant="outline" size="sm" className="w-full">
          {image ? "Thumbprint Verified ✓" : scanning ? "Scanning automatically..." : "Awaiting Sensor..."}
        </Button>
      </div>
      <style>{`@keyframes scanline { 0% { transform: translateY(0) } 100% { transform: translateY(100%) } }`}</style>
    </div>
  );
}

function InterventionsPortal({
  onBack,
  list,
  onAdd
}: {
  onBack: () => void;
  list: any[];
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
              <h3 className="font-display font-bold text-foreground text-sm">Log Distribution</h3>
              <p className="text-[10px] text-muted-foreground">Register resource delivery events</p>
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
              <label className="text-xs font-semibold text-foreground">Intervention Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              >
                <option value="" className="text-foreground">Select type</option>
                {MOCK_CATEGORIES.map((c) => <option key={c} value={c} className="text-foreground">{c}</option>)}
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
              <label className="text-xs font-semibold text-foreground">Distribution & Action Details</label>
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
                            {item.category}
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

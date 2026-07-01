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
import { Camera, Fingerprint, CheckCircle2, Loader2, RotateCcw, ShieldCheck, UserPlus, Download, Globe } from "lucide-react";
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
};

const empty: Form = {
  type: "", full_name: "", address: "", phone: "", dob: "", gender: "",
  nationality: "Nigeria", state_origin: "", lga: "", dependants: "0", reason: "",
};

const steps = ["Registration Type", "Biodata", "Review", "Biometrics"];

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

  useEffect(() => {
    if (!showIntro) return;
    const interval = setInterval(() => {
      setSimStep((s) => (s + 1) % 7);
    }, 4500);
    return () => clearInterval(interval);
  }, [showIntro]);

  const set = (k: keyof Form, v: string) => setData((d) => ({ ...d, [k]: v }));

  const canNext = () => {
    if (step === 0) return !!data.type;
    if (step === 1) {
      return data.full_name && data.address && data.phone && data.dob && data.gender &&
        data.nationality && data.state_origin && data.lga && data.reason.length >= 20;
    }
    if (step === 2) return true;
    if (step === 3) return !!face && !!thumb;
    return false;
  };

  const reset = () => {
    setStep(0); setData(empty); setFace(null); setThumb(null); setSuccess(false);
  };

  const submit = async () => {
    setSubmitting(true);
    const reference = `NCF-REG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: u } = await supabase.auth.getUser();
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
      circumstances: data.reason,
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
                  <Button variant="outline" size="sm" onClick={() => toast.info("App bundle download initiated.")} className="hover-lift">
                    <Download className="mr-2 h-3.5 w-3.5" /> Download & Install the App
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <Card className="p-6 sm:p-8 shadow-card">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of {steps.length}</div>
                  <h2 className="font-display text-2xl font-bold text-primary">{steps[step]}</h2>
                </div>
                <ShieldCheck className="h-8 w-8 text-accent" />
              </div>
              <Progress value={((step + 1) / steps.length) * 100} className="mb-6 h-2" />

              {step === 0 && (
                <div className="space-y-4">
                  <Field label="Select registration category *">
                    <Select value={data.type} onValueChange={(v) => set("type", v)}>
                      <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <p className="text-sm text-muted-foreground">
                    The category determines the relevant intake protocol, partner agencies and follow-up workflow.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4">
                  <Field label="Full legal name *"><Input value={data.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
                  <Field label="Current address / shelter *"><Textarea rows={2} value={data.address} onChange={(e) => set("address", e.target.value)} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone *"><Input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234…" /></Field>
                    <Field label="Date of birth *"><Input type="date" value={data.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
                    <Field label="Gender *">
                      <Select value={data.gender} onValueChange={(v) => set("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Nationality *"><Input value={data.nationality} onChange={(e) => set("nationality", e.target.value)} /></Field>
                    <Field label="State of origin *">
                      <Select value={data.state_origin} onValueChange={(v) => set("state_origin", v)}>
                        <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent className="max-h-60">{NG_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="LGA *"><Input value={data.lga} onChange={(e) => set("lga", e.target.value)} /></Field>
                    <Field label="Number of dependants"><Input type="number" min={0} value={data.dependants} onChange={(e) => set("dependants", e.target.value)} /></Field>
                  </div>
                  <Field label={`Circumstances & reason for ${typeLabel.toLowerCase()} * (min 20 characters)`}>
                    <Textarea rows={6} value={data.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Describe the situation: what happened, when, where, who is affected, assistance required." />
                    <div className="mt-1 text-xs text-muted-foreground">{data.reason.length} characters</div>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="font-display font-semibold text-primary">Review captured information</div>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                      <Row k="Category" v={typeLabel} />
                      <Row k="Full name" v={data.full_name} />
                      <Row k="Phone" v={data.phone} />
                      <Row k="DOB" v={data.dob} />
                      <Row k="Gender" v={data.gender} />
                      <Row k="Nationality" v={data.nationality} />
                      <Row k="State of origin" v={data.state_origin} />
                      <Row k="LGA" v={data.lga} />
                      <Row k="Dependants" v={data.dependants} />
                    </dl>
                    <div className="mt-3"><span className="text-xs font-semibold text-muted-foreground">Address:</span><p className="mt-1 text-sm">{data.address}</p></div>
                    <div className="mt-3"><span className="text-xs font-semibold text-muted-foreground">Reason:</span><p className="mt-1 whitespace-pre-wrap text-sm">{data.reason}</p></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confirm the above details with the registrant, then proceed to biometric capture.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <FaceCapture image={face} onCapture={setFace} />
                  <ThumbCapture image={thumb} scanning={scanning} setScanning={setScanning} onCapture={setThumb} />
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button variant="outline" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
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

  const start = async () => {
    setErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 480 } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setLive(true);
    } catch (e: any) {
      setErr(e?.message || "Unable to access camera. Please grant permission.");
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  };

  const snap = () => {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.85));
    stop();
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-primary">
        <Camera className="h-4 w-4" /> Facial Capture
      </div>
      <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
        {image ? (
          <img src={image} alt="Captured face" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        )}
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!image && !live && <Button size="sm" onClick={start}><Camera className="mr-2 h-4 w-4" /> Start camera</Button>}
        {!image && live && <Button size="sm" onClick={snap}>Capture</Button>}
        {image && <Button size="sm" variant="outline" onClick={() => { onCapture(null); start(); }}><RotateCcw className="mr-2 h-4 w-4" /> Retake</Button>}
      </div>
    </div>
  );
}

function ThumbCapture({ image, scanning, setScanning, onCapture }: {
  image: string | null; scanning: boolean; setScanning: (b: boolean) => void; onCapture: (d: string | null) => void;
}) {
  const scan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 1600));
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
    setScanning(false);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-primary">
        <Fingerprint className="h-4 w-4" /> Thumbprint Capture
      </div>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted">
        {image ? (
          <img src={image} alt="Captured thumbprint" className="h-full w-full object-contain" />
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
      <div className="mt-3 flex flex-wrap gap-2">
        {!image && <Button size="sm" onClick={scan} disabled={scanning}>
          {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
          {scanning ? "Scanning…" : "Scan thumb"}
        </Button>}
        {image && <Button size="sm" variant="outline" onClick={() => onCapture(null)}><RotateCcw className="mr-2 h-4 w-4" /> Rescan</Button>}
      </div>
      <style>{`@keyframes scanline { 0% { transform: translateY(0) } 100% { transform: translateY(100%) } }`}</style>
    </div>
  );
}

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Fingerprint, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import logo from "@/assets/ncfrmi-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ensureNotificationPermission, browserNotify } from "@/lib/notify";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "asylum" | "refugee" | "idp" | "returnee";
  typeLabel: string;
}

type Form = {
  full_name: string;
  dob: string;
  nationality: string; // Country
  passport_no: string;
  reason: string;      // Dropdown option
  consent: boolean;
};

const empty: Form = {
  full_name: "",
  dob: "",
  nationality: "",
  passport_no: "",
  reason: "",
  consent: false
};

const REASON_OPTIONS = [
  "Political Persecution / Fear of Prosecution",
  "Religious Persecution / Violation of Freedom of Belief",
  "Armed Conflict / Civil War / Fear of Violence",
  "Socio-Cultural Persecution / Gender-Based Violence",
  "Human Rights Violations / Freedom of Speech Censorship"
];

const AvatarSVG = () => (
  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 100 100" className="h-14 w-14">
      <circle cx="23" cy="52" r="7" fill="#d29d78" />
      <circle cx="77" cy="52" r="7" fill="#d29d78" />
      <path d="M 40,60 L 40,80 L 60,80 L 60,60 Z" fill="#d29d78" />
      <circle cx="50" cy="48" r="25" fill="#e0ab85" />
      <path d="M 25,44 C 25,18 75,18 75,44 C 70,42 60,38 50,42 C 40,38 30,42 25,44 Z" fill="#1d124b" />
      <path d="M 33,38 C 37,35 43,36 45,39" stroke="#100b2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 67,38 C 63,35 57,36 55,39" stroke="#100b2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="46" r="3" fill="#100b2b" />
      <circle cx="61" cy="46" r="3" fill="#100b2b" />
      <path d="M 37,56 Q 50,68 63,56 Z" fill="#ffffff" />
      <path d="M 37,56 Q 50,68 63,56" stroke="#b17e5a" strokeWidth="1.5" fill="none" />
    </svg>
  </div>
);

export default function ApplicationFormDialog({ open, onOpenChange, type, typeLabel }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState<string>("");

  // Biometrics simulation states
  const [scanningFace, setScanningFace] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [scanningThumb, setScanningThumb] = useState(false);
  const [thumbVerified, setThumbVerified] = useState(false);

  const steps = ["Personal & Case Info", "Biometric Enrolment", "Consent & Submission"];
  const total = steps.length;
  const set = (k: keyof Form, v: any) => setData((d) => ({ ...d, [k]: v }));

  // Automated biometric sequence
  React.useEffect(() => {
    if (step === 1) {
      if (!faceVerified) {
        setScanningFace(true);
        const timer = setTimeout(() => {
          setScanningFace(false);
          setFaceVerified(true);
          toast.success("Facial biometric verification complete.");
        }, 2200);
        return () => clearTimeout(timer);
      } else if (!thumbVerified) {
        setScanningThumb(true);
        const timer = setTimeout(() => {
          setScanningThumb(false);
          setThumbVerified(true);
          toast.success("Thumbprint index biometric captured.");
          // Auto advance to Step 2
          setTimeout(() => setStep(2), 800);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [step, faceVerified, thumbVerified]);

  const handleBack = () => {
    if (step === 1) {
      setFaceVerified(false);
      setThumbVerified(false);
    }
    setStep((s) => s - 1);
  };

  const canNext = () => {
    if (step === 0) {
      return !!(data.full_name && data.dob && data.nationality && data.passport_no && data.reason);
    }
    if (step === 1) {
      return faceVerified && thumbVerified;
    }
    if (step === 2) {
      return data.consent;
    }
    return false;
  };

  const reset = () => {
    setStep(0);
    setData(empty);
    setFaceVerified(false);
    setThumbVerified(false);
    setSubmitted(false);
  };

  const submit = async () => {
    setSubmitting(true);
    const generatedRef = `NCF-ASY-${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      const isUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (user && isUuid) {
        const { error } = await supabase.from("applications").insert({
          user_id: user.id,
          type: type as any,
          full_name: data.full_name,
          phone: "N/A",
          state: "Federal Capital Territory",
          lga: "Abuja",
          reason: `Reason: ${data.reason}\nDOB: ${data.dob}\nCountry: ${data.nationality}\nPassport No: ${data.passport_no}`,
        });
        if (error) throw error;
      }

      // Sync with admin dashboard local registrants database
      const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      local.push({
        id: Math.random().toString(36).slice(2, 9),
        reference: generatedRef,
        category: "refugee", // Map asylum seeker under refugees
        full_name: data.full_name,
        address: `Passport: ${data.passport_no}, Country: ${data.nationality}`,
        phone: "N/A",
        dob: data.dob,
        gender: "Other",
        nationality: data.nationality,
        state_origin: "FCT",
        lga: "Abuja",
        dependants: 0,
        circumstances: `Reason: ${data.reason}\nPassport: ${data.passport_no}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(local));

      setReference(generatedRef);
      const allowed = await ensureNotificationPermission();
      if (allowed) {
        browserNotify("NCFRMI — Asylum Status Generated", `Asylum Seeker Code ${generatedRef} is active.`);
      }
      toast.success("Application successfully submitted!");
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Could not process request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Landscape PDF Certificate Exporter
  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Double security borders
      doc.setDrawColor(11, 102, 60); // Green
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 281, 194);
      doc.setDrawColor(212, 175, 55); // Gold
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 277, 190);

      // Crest Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(11, 102, 60);
      doc.text("FEDERAL REPUBLIC OF NIGERIA", 148, 22, { align: "center" });

      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("NATIONAL COMMISSION FOR REFUGEES, MIGRANTS AND INTERNALLY DISPLACED PERSONS", 148, 28, { align: "center" });

      // Document Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(11, 102, 60);
      doc.text("OFFICIAL CERTIFICATE OF ASYLUM STATUS", 148, 48, { align: "center" });

      // Body text
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text("This is to formally certify that the individual named below has been granted official protection status as an Asylum Seeker", 148, 62, { align: "center" });
      doc.text("under the provisions of the National Commission for Refugees Act, Cap N21, Laws of the Federation of Nigeria,", 148, 67, { align: "center" });
      doc.text("and aligned international treaties, conventions, and humanitarian protocols.", 148, 72, { align: "center" });

      // Info Table Block
      let y = 88;
      doc.setFillColor(248, 250, 252);
      doc.rect(25, y, 247, 65, "F");
      doc.rect(25, y, 247, 65, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("REGISTRATION REFERENCE:", 35, y + 10);
      doc.text("FULL LEGAL NAME:", 35, y + 20);
      doc.text("DATE OF BIRTH:", 35, y + 30);
      doc.text("COUNTRY OF ORIGIN:", 35, y + 40);
      doc.text("PASSPORT NUMBER:", 35, y + 50);
      doc.text("REASON FOR ASYLUM:", 35, y + 60);

      doc.setFont("Helvetica", "normal");
      doc.text(reference, 105, y + 10);
      doc.text(data.full_name.toUpperCase(), 105, y + 20);
      doc.text(data.dob, 105, y + 30);
      doc.text(data.nationality.toUpperCase(), 105, y + 40);
      doc.text(data.passport_no.toUpperCase(), 105, y + 50);
      doc.text(data.reason.toUpperCase(), 105, y + 60);

      // Gold Seal
      doc.setFillColor(212, 175, 55);
      doc.ellipse(50, 172, 11, 11, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("NCFRMI", 50, 173, { align: "center" });
      doc.text("SEAL", 50, 177, { align: "center" });

      // Signature Block
      doc.setDrawColor(148, 163, 184);
      doc.line(190, 170, 260, 170);
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("HON. COMMISSIONER", 225, 175, { align: "center" });
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text("NCFRMI Federal Secretariat, Abuja", 225, 179, { align: "center" });

      // Demo watermark disclaimer
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38); // Red
      doc.text("DEMO PURPOSES ONLY • SUBJECT TO FINAL PHYSICAL VERIFICATION AND OFFICIAL COMMISSION APPROVAL", 148, 198, { align: "center" });

      doc.save(`NCFRMI_Asylum_Certificate_${reference}.pdf`);
      toast.success("Landscape PDF certificate downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF certificate file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className={`w-[calc(100%-1.5rem)] max-h-[92vh] overflow-y-auto p-4 sm:p-6 transition-all duration-500 ${submitted ? "sm:max-w-2xl md:max-w-4xl" : "sm:max-w-xl md:max-w-2xl"}`}>
        
        {submitted ? (
          /* Certificate Preview Mode */
          <div className="space-y-6 animate-fade-in py-2">
            <div className="text-center">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-xs">Biometrics Authenticated & Signed</Badge>
              <h2 className="mt-2 font-display text-xl font-bold">Preview Certificate of Asylum</h2>
              <p className="text-xs text-muted-foreground">Official preview issued under the National Commission for Refugees Act.</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 text-left space-y-1">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" /> Demo Certificate Issued Automatically
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-relaxed">
                This certificate has been issued automatically for demonstration and preview purposes. The real application process requires official validation, background checks, and an invitation to the Commission headquarters for physical verification before final approval is granted.
              </p>
            </div>

            {/* Certificate Border Card */}
            <div className="border-[6px] border-double border-emerald-800 p-3 sm:p-6 bg-slate-50 dark:bg-zinc-900/40 rounded-xl relative shadow-md">
              <div className="border border-amber-500/40 p-4 sm:p-6 space-y-6">
                
                {/* Certificate Header */}
                <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <img src={logo} alt="Nigeria Seal" className="h-14 w-14 object-contain" />
                  <div>
                    <h3 className="font-display font-black text-xs text-emerald-800 dark:text-emerald-500 tracking-wider">FEDERAL REPUBLIC OF NIGERIA</h3>
                    <h4 className="font-display font-bold text-[9px] sm:text-xs text-slate-700 dark:text-zinc-300">NATIONAL COMMISSION FOR REFUGEES, MIGRANTS &amp; IDPs</h4>
                    <div className="text-[15px] sm:text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mt-1">Certificate of Asylum seeker status</div>
                  </div>
                </div>

                {/* Details Grid & Portrait */}
                <div className="grid gap-4 sm:grid-cols-4 items-center border-t border-b py-4 border-slate-200 dark:border-zinc-800">
                  <div className="sm:col-span-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] sm:text-xs">
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Ref ID / Case Code</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{reference}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Biometrics Index</span>
                      <span className="text-emerald-600 dark:text-emerald-450 font-bold">BIO-VERIFIED (SHA256)</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Full Legal Name</span>
                      <span className="font-bold text-slate-950 dark:text-slate-50 uppercase">{data.full_name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Date of Birth</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{data.dob}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Country of Origin</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{data.nationality}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Passport Number</span>
                      <span className="font-mono font-semibold text-slate-950 dark:text-slate-50 uppercase">{data.passport_no}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Reason for Asylum</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{data.reason}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Date of Issue</span>
                      <span>{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700 shadow-inner h-28 w-24 mx-auto sm:mr-0">
                    <AvatarSVG />
                    <div className="text-[7px] text-emerald-600 dark:text-emerald-450 font-bold mt-1.5 uppercase">SECURE PASS</div>
                  </div>
                </div>

                {/* Certificate Footer Stamp & Signatures */}
                <div className="flex justify-between items-end pt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-11 w-11 rounded-full border-4 border-double border-amber-600 bg-amber-500/10 flex flex-col items-center justify-center text-[7px] font-bold text-amber-700 shadow-inner">
                      <span>NCFRMI</span>
                      <span>SEAL</span>
                    </div>
                    <div className="text-[7px] text-slate-400 leading-tight">
                      * Under Decree 52 of Cap N21.<br />Abuja Federal Headquarters.
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-mono text-xs italic text-slate-500 border-b border-slate-350 pb-1">Aliyu Ahmed</div>
                    <div className="text-[8px] font-bold text-slate-700 dark:text-slate-300 uppercase">Hon. Commissioner</div>
                    <div className="text-[7px] text-slate-400">NCFRMI Federal Secretariat</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={downloadPDF} size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white hover-lift">
                Download Official PDF Certificate
              </Button>
              <Button variant="outline" size="lg" className="flex-1 hover-lift" onClick={() => onOpenChange(false)}>
                Close Portal
              </Button>
            </div>
          </div>
        ) : (
          /* Modern simplified 3-step application form */
          <>
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <img src={logo} alt="NCFRMI" className="h-12 w-12 object-contain" />
              <div>
                <div className="font-display text-sm font-bold text-primary uppercase tracking-wide">NCFRMI · Federal Republic of Nigeria</div>
                <div className="text-xs text-muted-foreground">Secure Asylum Application Portal</div>
              </div>
            </div>
            
            <DialogHeader>
              <DialogTitle className="font-display">Asylum Application — Step {step+1} of {total}: {steps[step]}</DialogTitle>
              <DialogDescription>All information is processed under standard digital sandbox security protocols.</DialogDescription>
            </DialogHeader>
            
            <Progress value={((step+1)/total)*100} className="h-1.5" />

            <div className="grid gap-4 py-2">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/75 uppercase tracking-wide">Full Legal Name *</label>
                    <Input
                      value={data.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="Firstname Middlename Lastname (As in passport)"
                      className="h-10 text-sm focus-visible:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/75 uppercase tracking-wide">Date of Birth *</label>
                      <Input
                        type="date"
                        value={data.dob}
                        onChange={(e) => set("dob", e.target.value)}
                        className="h-10 text-sm focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/75 uppercase tracking-wide">Country of Origin *</label>
                      <Input
                        value={data.nationality}
                        onChange={(e) => set("nationality", e.target.value)}
                        placeholder="e.g. Sudan, Syria"
                        className="h-10 text-sm focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/75 uppercase tracking-wide">Passport Number *</label>
                    <Input
                      value={data.passport_no}
                      onChange={(e) => set("passport_no", e.target.value)}
                      placeholder="Enter valid international passport number"
                      className="h-10 text-sm focus-visible:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/75 uppercase tracking-wide">Reason for Asylum Status *</label>
                    <Select value={data.reason} onValueChange={(v) => set("reason", v)}>
                      <SelectTrigger className="h-10 text-sm focus-visible:ring-emerald-500">
                        <SelectValue placeholder="Select relevant asylum grounds" />
                      </SelectTrigger>
                      <SelectContent>
                        {REASON_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 py-4 flex flex-col items-center">
                  <div className="text-center space-y-1.5">
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wide">High-Tech Biometrics Enrolment</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Wait for the system to scan your face and verify your thumbprint.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 justify-center items-center w-full">
                    {/* Face Scan Panel */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative h-32 w-32 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center shadow-inner">
                        {scanningFace ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10">
                            <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline z-20" />
                            <Camera className="h-6 w-6 text-primary animate-pulse" />
                            <span className="text-[8px] font-bold text-primary mt-1">Scanning Face...</span>
                          </div>
                        ) : faceVerified ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/20">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
                            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-450 mt-1">Face Matched ✓</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Awaiting Face Scan</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold">1. Facial Recognition</span>
                    </div>

                    {/* Fingerprint Panel */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative h-32 w-24 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl">
                        {scanningThumb ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Fingerprint className="h-10 w-10 text-emerald-400 animate-pulse" />
                            <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                            <span className="text-[8px] font-bold text-emerald-400 mt-1">Scanning...</span>
                          </div>
                        ) : thumbVerified ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-emerald-450 mt-1">Indexed ✓</span>
                          </div>
                        ) : (
                          <div className="text-center text-zinc-700 text-[10px] p-2 flex flex-col items-center">
                            <Fingerprint className="h-10 w-10 text-zinc-750 opacity-60 mb-1" />
                            <span className="text-[9px]">Awaiting Finger</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold">2. Thumbprint Scan</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="px-3 py-1 font-mono text-[10px]">
                    {scanningFace && "FACIAL_SCAN_IN_PROGRESS"}
                    {faceVerified && !scanningThumb && "FACIAL_VERIFIED | INDEXING_THUMBPRINT"}
                    {thumbVerified && "BIOMETRICS_VERIFIED_SHA256_ACTIVE"}
                  </Badge>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-3">
                    <div className="font-display font-semibold text-primary">Review Application Summary</div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex gap-2">
                        <span className="font-bold text-muted-foreground">Full Name:</span>
                        <span className="font-semibold">{data.full_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-muted-foreground">Date of Birth:</span>
                        <span>{data.dob}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-muted-foreground">Country:</span>
                        <span>{data.nationality}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-muted-foreground">Passport No:</span>
                        <span className="font-mono">{data.passport_no}</span>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1 mt-1 border-t pt-2">
                        <span className="font-bold text-muted-foreground">Asylum Grounds:</span>
                        <span className="italic">{data.reason}</span>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs p-1 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={data.consent}
                      onChange={(e) => set("consent", e.target.checked)}
                    />
                    <span className="leading-relaxed">
                      I declare that the information provided is correct to the best of my knowledge and I consent to NCFRMI generating my digital asylum seeker index.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between border-t pt-3 mt-2">
              <Button variant="outline" disabled={step === 0 || submitting} onClick={handleBack}>
                Back
              </Button>
              {step < total - 1 ? (
                <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </Button>
              ) : (
                <Button
                  disabled={!canNext() || submitting}
                  onClick={submit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit &amp; Issue Certificate
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

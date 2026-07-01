import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Fingerprint, CheckCircle2 } from "lucide-react";
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

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

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

type Form = {
  full_name: string; phone: string; email: string; dob: string; gender: string;
  nationality: string; state: string; lga: string; address: string;
  dependants: string; reason: string; consent: boolean;
};

const empty: Form = { full_name:"", phone:"", email:"", dob:"", gender:"", nationality:"Sudan", state:"", lga:"", address:"", dependants:"0", reason:"", consent:false };

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
  const [facialInstruction, setFacialInstruction] = useState("Position your face in the frame...");
  const [scanningThumb, setScanningThumb] = useState(false);
  const [thumbVerified, setThumbVerified] = useState(false);

  const steps = ["Personal Info", "Location & Contact", "Case Details", "Facial Capture", "Thumbprint Capture", "Review & Submit"];
  const total = steps.length;
  const set = (k: keyof Form, v: any) => setData((d) => ({ ...d, [k]: v }));

  // Synthesized audio beep generator (no external file needed)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15); // Play for 150ms
    } catch (e) {
      console.warn("AudioContext beep failed:", e);
    }
  };

  // Automated biometric capture effects
  React.useEffect(() => {
    if (step === 3 && !faceVerified && !scanningFace) {
      setScanningFace(true);
      const timer = setTimeout(() => {
        setScanningFace(false);
        setFaceVerified(true);
        playBeep();
        toast.success("Facial biometric profile scanned automatically!");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, faceVerified, scanningFace]);

  React.useEffect(() => {
    if (step === 4 && !thumbVerified && !scanningThumb) {
      setScanningThumb(true);
      const timer = setTimeout(() => {
        setScanningThumb(false);
        setThumbVerified(true);
        playBeep();
        toast.success("Biometric thumbprint scanned automatically!");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, thumbVerified, scanningThumb]);

  const handleBack = () => {
    if (step === 4) setThumbVerified(false);
    if (step === 3) setFaceVerified(false);
    setStep((s) => s - 1);
  };

  const canNext = () => {
    if (step === 0) return !!(data.full_name && data.dob && data.gender && data.nationality);
    if (step === 1) return !!(data.phone && data.email && data.state && data.lga && data.address);
    if (step === 2) return data.reason.length >= 20;
    if (step === 3) return faceVerified;
    if (step === 4) return thumbVerified;
    if (step === 5) return data.consent;
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
    const generatedRef = `NCF-ASY-${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    try {
      if (user) {
        const { error } = await supabase.from("applications").insert({
          user_id: user.id, type: type as any, full_name: data.full_name,
          phone: data.phone, state: data.state, lga: data.lga,
          reason: `${data.reason}\n\nDOB: ${data.dob} | Gender: ${data.gender} | Nationality: ${data.nationality} | Email: ${data.email} | Address: ${data.address} | Dependants: ${data.dependants}`,
        });
        if (error) throw error;
      }

      // Also write to local storage fallback database for admin dashboard visibility
      const local = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      local.push({
        id: Math.random().toString(36).slice(2, 9),
        reference: generatedRef,
        category: "refugee", // Map asylum seeker under refugee index
        full_name: data.full_name,
        address: data.address,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        nationality: data.nationality,
        state_origin: data.state,
        lga: data.lga,
        dependants: parseInt(data.dependants) || 0,
        circumstances: data.reason,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("ncfrmi_local_registrants", JSON.stringify(local));

      setReference(generatedRef);
      const allowed = await ensureNotificationPermission();
      if (allowed) browserNotify("NCFRMI — Asylum Granted", `Certificate Reference ${generatedRef} is active.`);
      toast.success("Application submitted successfully");
      
      // Keep dialog open but transition content to certificate preview mode
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Could not submit. Please try again.");
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
      doc.text("REGISTRATION REFERENCE:", 35, y + 10);
      doc.text("FULL LEGAL NAME:", 35, y + 20);
      doc.text("NATIONALITY:", 35, y + 30);
      doc.text("CAPTURE LOCATION:", 35, y + 40);
      doc.text("DATE OF ISSUANCE:", 35, y + 50);
      doc.text("BIOMETRICS VERIFICATION INDEX:", 35, y + 60);

      doc.setFont("Helvetica", "normal");
      doc.text(reference, 105, y + 10);
      doc.text(data.full_name.toUpperCase(), 105, y + 20);
      doc.text(data.nationality.toUpperCase(), 105, y + 30);
      doc.text(`${data.state} State, Nigeria`, 105, y + 40);
      doc.text(new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }), 105, y + 50);
      doc.text("BIO-VERIFIED-SECURE-SHA256", 105, y + 60);

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
          /* Certificate Preview Layout */
          <div className="space-y-6 animate-fade-in py-2">
            <div className="text-center">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-xs">Biometrics Authenticated & Signed</Badge>
              <h2 className="mt-2 font-display text-xl font-bold">Preview Certificate of Asylum</h2>
              <p className="text-xs text-muted-foreground">Official government document issued under the Refugees Decree Act.</p>
            </div>

            {/* Certificate Paper Frame */}
            <div className="relative p-6 sm:p-8 rounded-lg border-double border-8 border-emerald-600 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 shadow-elegant overflow-hidden select-none">
              {/* Border accents */}
              <div className="absolute inset-1 border border-amber-500/25 pointer-events-none rounded" />
              
              {/* Watermark Crest */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                <img src={logo} alt="" className="h-[260px] w-[260px] object-contain" />
              </div>

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <img src={logo} alt="Crest" className="h-14 w-14 object-contain" />
                  <div className="text-[9px] font-bold tracking-wider uppercase text-emerald-700 mt-2">Federal Republic of Nigeria</div>
                  <div className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase mt-0.5">National Commission for Refugees, Migrants and Internally Displaced Persons</div>
                </div>

                {/* Document Title */}
                <div className="text-center space-y-1">
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-emerald-800 uppercase tracking-wide">Certificate of Asylum Status</h3>
                  <div className="h-0.5 w-32 bg-amber-500 mx-auto" />
                </div>

                {/* Legal Preamble */}
                <p className="text-[10px] sm:text-xs text-center text-slate-600 dark:text-slate-350 max-w-xl mx-auto leading-relaxed">
                  This is to formally certify that the individual detailed below has been granted official protection status as an <strong>Asylum Seeker</strong> in Nigeria, under the provisions of the National Commission for Refugees Act, Cap N21, Laws of the Federation, and aligned international humanitarian conventions.
                </p>

                {/* Details Grid & QR Code */}
                <div className="grid gap-4 sm:grid-cols-4 items-center border-t border-b py-4 border-slate-200 dark:border-slate-800">
                  {/* Table details */}
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
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Nationality</span>
                      <span className="font-semibold">{data.nationality}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">State of Capture</span>
                      <span>{data.state} State</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[8px]">Date of Issue</span>
                      <span>{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* HTML QR Code element */}
                  <div className="sm:col-span-1 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-3 border-slate-200 dark:border-slate-800">
                    <svg className="h-16 w-16 border p-1 bg-white text-black" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                      <rect x="10" y="10" width="10" height="10" fill="white" />
                      <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                      <rect x="80" y="10" width="10" height="10" fill="white" />
                      <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                      <rect x="10" y="80" width="10" height="10" fill="white" />
                      <rect x="35" y="5" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="15" width="15" height="5" fill="currentColor" />
                      <rect x="5" y="35" width="15" height="5" fill="currentColor" />
                      <rect x="15" y="45" width="5" height="15" fill="currentColor" />
                      <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                      <rect x="40" y="40" width="20" height="20" fill="white" />
                      <rect x="47" y="47" width="6" height="6" fill="currentColor" />
                      <rect x="75" y="35" width="15" height="15" fill="currentColor" />
                      <rect x="35" y="75" width="15" height="15" fill="currentColor" />
                      <rect x="85" y="85" width="10" height="10" fill="currentColor" />
                      <rect x="65" y="65" width="10" height="10" fill="currentColor" />
                    </svg>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-1">Scan to Verify</span>
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
          /* Normal Multi-Step Application Form */
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
              <DialogDescription>All information is encrypted and processed under Nigerian data-protection law.</DialogDescription>
            </DialogHeader>
            
            <Progress value={((step+1)/total)*100} className="h-2" />

            <div className="grid gap-4 py-2">
              {step === 0 && (
                <>
                  <Field label="Full legal name *">
                    <Input value={data.full_name} onChange={(e)=>set("full_name",e.target.value)} placeholder="Firstname Middlename Lastname" />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Date of birth *">
                      <Input type="date" value={data.dob} onChange={(e)=>set("dob",e.target.value)} />
                    </Field>
                    <Field label="Gender *">
                      <Select value={data.gender} onValueChange={(v)=>set("gender",v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Nationality *">
                      <Input value={data.nationality} onChange={(e)=>set("nationality",e.target.value)} />
                    </Field>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone number *">
                      <Input type="tel" value={data.phone} onChange={(e)=>set("phone",e.target.value)} placeholder="+234…" />
                    </Field>
                    <Field label="Email address *">
                      <Input type="email" value={data.email} onChange={(e)=>set("email",e.target.value)} placeholder="name@example.com" />
                    </Field>
                    <Field label="Current state *">
                      <Select value={data.state} onValueChange={(v)=>set("state",v)}>
                        <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {NG_STATES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="LGA / Town *">
                      <Input value={data.lga} onChange={(e)=>set("lga",e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Current address / shelter *">
                    <Textarea rows={2} value={data.address} onChange={(e)=>set("address",e.target.value)} />
                  </Field>
                  <Field label="Number of dependants">
                    <Input type="number" min={0} value={data.dependants} onChange={(e)=>set("dependants",e.target.value)} />
                  </Field>
                </>
              )}

              {step === 2 && (
                <Field label="Describe your circumstances and reason for asylum * (min 20 characters)">
                  <Textarea rows={8} value={data.reason} onChange={(e)=>set("reason",e.target.value)} placeholder="Provide a clear account: what happened, when, where, who is affected, and what assistance you need." />
                  <div className="mt-1 text-xs text-muted-foreground">{data.reason.length} characters</div>
                </Field>
              )}

              {step === 3 && (
                <div className="space-y-4 text-center py-4 flex flex-col items-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h4 className="font-semibold text-sm">Facial Capture</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto h-8 flex items-center justify-center">
                      {scanningFace ? (
                        <span className="text-primary font-semibold animate-pulse">Position your face in the camera frame...</span>
                      ) : faceVerified ? (
                        <span className="text-emerald-600 font-semibold">Facial scan verified successfully.</span>
                      ) : (
                        "Position your device camera directly in front of your face. Keep a neutral expression."
                      )}
                    </p>
                  </div>

                  <div className="relative mx-auto h-36 w-36 rounded-full bg-slate-100 border-2 border-emerald-500 overflow-hidden flex items-center justify-center shadow-inner">
                    {scanningFace ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10">
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline z-20" />
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-[9px] font-bold text-primary mt-2">Scanning Face...</span>
                      </div>
                    ) : faceVerified ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50/50">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
                        <span className="text-[9px] font-bold text-emerald-600 mt-1">Matched ✓</span>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-[10px] p-2 animate-pulse">
                        Awaiting Camera...
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-2">
                    <Button disabled className={`hover-lift transition-all duration-300 ${faceVerified ? "bg-emerald-600 text-white" : ""}`}>
                      {faceVerified ? "Facial Capture Verified ✓" : scanningFace ? "Scanning automatically..." : "Awaiting Scanner..."}
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Fingerprint Scanning Index</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">Press your right thumb firmly on the sensor panel to register your identity index.</p>
                  </div>

                  <div className="relative mx-auto h-32 w-24 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl">
                    {scanningThumb ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Fingerprint className="h-12 w-12 text-slate-700" />
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                        <span className="text-[9px] font-bold text-emerald-400 mt-1">Verifying Index...</span>
                      </div>
                    ) : thumbVerified ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-450 mt-1">Biometrics Indexed ✓</span>
                      </div>
                    ) : (
                      <div className="text-center text-zinc-500 text-[10px] p-2 flex flex-col items-center animate-pulse">
                        <Fingerprint className="h-10 w-10 text-zinc-700 opacity-60 mb-1" />
                        Initialising fingerprint sensor...
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button disabled className={`hover-lift ${thumbVerified ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}>
                      {thumbVerified ? "Thumbprint Registered ✓" : scanningThumb ? "Indexing automatically..." : "Awaiting Sensor..."}
                    </Button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                  <div className="font-display font-semibold text-primary">Review asylum application information</div>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Row k="Name" v={data.full_name} />
                    <Row k="DOB" v={data.dob} />
                    <Row k="Gender" v={data.gender} />
                    <Row k="Nationality" v={data.nationality} />
                    <Row k="Phone" v={data.phone} />
                    <Row k="Email" v={data.email} />
                    <Row k="State / LGA" v={`${data.state} / ${data.lga}`} />
                    <Row k="Dependants" v={data.dependants} />
                  </dl>
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-muted-foreground">Reason/Circumstances:</span>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{data.reason}</p>
                  </div>
                  <label className="mt-4 flex items-start gap-2 text-xs">
                    <input type="checkbox" className="mt-0.5" checked={data.consent} onChange={(e)=>set("consent",e.target.checked)} />
                    <span>I declare that the information provided is true to the best of my knowledge and I consent to NCFRMI processing it for the purpose of this asylum seeker grant certificate.</span>
                  </label>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" disabled={step===0 || submitting} onClick={handleBack}>Back</Button>
              {step < total-1 ? (
                <Button disabled={!canNext()} onClick={()=>setStep((s)=>s+1)}>Continue</Button>
              ) : (
                <Button disabled={!canNext() || submitting} onClick={submit}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} File Asylum Case & Sign
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-sm font-medium">{label}</label><div className="mt-1.5">{children}</div></div>
);
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-2"><dt className="min-w-24 text-xs font-semibold text-muted-foreground">{k}:</dt><dd className="text-sm">{v || "—"}</dd></div>
);

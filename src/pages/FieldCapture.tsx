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
import { Camera, Fingerprint, CheckCircle2, Loader2, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess(true);
    toast.success("Data has been captured successfully");
  };

  const typeLabel = TYPES.find((t) => t.value === data.type)?.label ?? "—";

  return (
    <Layout>
      <PageHero
        title="Field Officer — Data Capture"
        subtitle="Secure on-site enrolment of Migrants, Returnees, Refugees and IDPs with biometric verification."
      />
      <section className="container-page py-10">
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

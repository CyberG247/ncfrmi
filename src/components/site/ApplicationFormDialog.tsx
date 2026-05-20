import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import logo from "@/assets/ncfrmi-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ApplicationReceivedDialog from "./ApplicationReceivedDialog";
import { browserNotify, ensureNotificationPermission } from "@/lib/notify";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "asylum" | "refugee" | "idp" | "returnee";
  typeLabel: string;
}

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

type Form = {
  full_name: string; phone: string; email: string; dob: string; gender: string;
  nationality: string; state: string; lga: string; address: string;
  dependants: string; reason: string; consent: boolean;
};

const empty: Form = { full_name:"", phone:"", email:"", dob:"", gender:"", nationality:"Nigeria", state:"", lga:"", address:"", dependants:"0", reason:"", consent:false };

export default function ApplicationFormDialog({ open, onOpenChange, type, typeLabel }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const [reference, setReference] = useState<string>("");

  const steps = ["Personal Info", "Location & Contact", "Case Details", "Review & Submit"];
  const total = steps.length;
  const set = (k: keyof Form, v: any) => setData((d) => ({ ...d, [k]: v }));

  const canNext = () => {
    if (step === 0) return data.full_name && data.dob && data.gender && data.nationality;
    if (step === 1) return data.phone && data.email && data.state && data.lga && data.address;
    if (step === 2) return data.reason.length >= 20;
    if (step === 3) return data.consent;
    return false;
  };

  const reset = () => { setStep(0); setData(empty); };

  const submit = async () => {
    setSubmitting(true);
    let ref = `NCF-${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    try {
      if (user) {
        const { data: row, error } = await supabase.from("applications").insert({
          user_id: user.id, type: type as any, full_name: data.full_name,
          phone: data.phone, state: data.state, lga: data.lga,
          reason: `${data.reason}\n\nDOB: ${data.dob} | Gender: ${data.gender} | Nationality: ${data.nationality} | Email: ${data.email} | Address: ${data.address} | Dependants: ${data.dependants}`,
        }).select("reference").single();
        if (error) throw error;
        if (row?.reference) ref = row.reference;
      }
      setReference(ref);
      const allowed = await ensureNotificationPermission();
      if (allowed) browserNotify("NCFRMI — Application Acknowledged", `Ref ${ref}. We will update you on progress.`);
      toast.success("Application acknowledged", { description: `Reference ${ref}` });
      onOpenChange(false);
      setAckOpen(true);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <img src={logo} alt="NCFRMI" className="h-12 w-12 object-contain" />
            <div>
              <div className="font-display text-sm font-bold text-primary uppercase tracking-wide">NCFRMI · Federal Republic of Nigeria</div>
              <div className="text-xs text-muted-foreground">Secure {typeLabel} Application Portal</div>
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="font-display">{typeLabel} — Step {step+1} of {total}: {steps[step]}</DialogTitle>
            <DialogDescription>All information is encrypted and processed under Nigerian data-protection law.</DialogDescription>
          </DialogHeader>
          <Progress value={((step+1)/total)*100} className="h-2" />

          <div className="grid gap-4 py-2">
            {step === 0 && (
              <>
                <Field label="Full legal name *"><Input value={data.full_name} onChange={(e)=>set("full_name",e.target.value)} /></Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Date of birth *"><Input type="date" value={data.dob} onChange={(e)=>set("dob",e.target.value)} /></Field>
                  <Field label="Gender *">
                    <Select value={data.gender} onValueChange={(v)=>set("gender",v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="female">Female</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nationality *"><Input value={data.nationality} onChange={(e)=>set("nationality",e.target.value)} /></Field>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone number *"><Input type="tel" value={data.phone} onChange={(e)=>set("phone",e.target.value)} placeholder="+234…" /></Field>
                  <Field label="Email address *"><Input type="email" value={data.email} onChange={(e)=>set("email",e.target.value)} /></Field>
                  <Field label="Current state *">
                    <Select value={data.state} onValueChange={(v)=>set("state",v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent className="max-h-60">{NG_STATES.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="LGA / Town *"><Input value={data.lga} onChange={(e)=>set("lga",e.target.value)} /></Field>
                </div>
                <Field label="Current address / shelter *"><Textarea rows={2} value={data.address} onChange={(e)=>set("address",e.target.value)} /></Field>
                <Field label="Number of dependants"><Input type="number" min={0} value={data.dependants} onChange={(e)=>set("dependants",e.target.value)} /></Field>
              </>
            )}
            {step === 2 && (
              <Field label={`Describe your circumstances and reason for ${typeLabel.toLowerCase()} * (min 20 characters)`}>
                <Textarea rows={8} value={data.reason} onChange={(e)=>set("reason",e.target.value)} placeholder="Provide a clear account: what happened, when, where, who is affected, and what assistance you need." />
                <div className="mt-1 text-xs text-muted-foreground">{data.reason.length} characters</div>
              </Field>
            )}
            {step === 3 && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <div className="font-display font-semibold text-primary">Review your information</div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Row k="Name" v={data.full_name} /><Row k="DOB" v={data.dob} />
                  <Row k="Gender" v={data.gender} /><Row k="Nationality" v={data.nationality} />
                  <Row k="Phone" v={data.phone} /><Row k="Email" v={data.email} />
                  <Row k="State / LGA" v={`${data.state} / ${data.lga}`} />
                  <Row k="Dependants" v={data.dependants} />
                </dl>
                <div className="mt-3"><span className="text-xs font-semibold text-muted-foreground">Reason:</span><p className="mt-1 whitespace-pre-wrap">{data.reason}</p></div>
                <label className="mt-4 flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5" checked={data.consent} onChange={(e)=>set("consent",e.target.checked)} />
                  <span>I declare that the information provided is true to the best of my knowledge and I consent to NCFRMI processing it for the purpose of this application, in line with the Nigeria Data Protection Act.</span>
                </label>
                {!user && <p className="mt-3 rounded-md bg-accent/20 p-2 text-xs text-foreground">Tip: <a href="/register" className="underline">Create an account</a> to track this case in real time.</p>}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" disabled={step===0 || submitting} onClick={()=>setStep((s)=>s-1)}>Back</Button>
            {step < total-1 ? (
              <Button disabled={!canNext()} onClick={()=>setStep((s)=>s+1)}>Continue</Button>
            ) : (
              <Button disabled={!canNext() || submitting} onClick={submit}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit application
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicationReceivedDialog
        open={ackOpen}
        onOpenChange={setAckOpen}
        title={`${typeLabel} Acknowledged`}
        reference={reference}
        message={`Your ${typeLabel.toLowerCase()} has been formally received by the National Commission for Refugees, Migrants & IDPs. Our case officers will review it and contact you with next steps via email, SMS, and in-app notifications.`}
        continueLabel="Done"
      />
    </>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-sm font-medium">{label}</label><div className="mt-1.5">{children}</div></div>
);
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-2"><dt className="min-w-24 text-xs font-semibold text-muted-foreground">{k}:</dt><dd className="text-sm">{v || "—"}</dd></div>
);

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Camera, Fingerprint, MapPin, Phone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORY_LABEL: Record<string, string> = {
  idp: "Internally Displaced Person",
  refugee: "Refugee",
  migrant: "Migrant",
  returnee: "Returnee",
};

export default function RegistrantDetail() {
  const { id } = useParams();
  const [r, setR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [biometrics, setBiometrics] = useState<{ face: string | null; thumb: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("registrants").select("*").eq("id", id!).maybeSingle();
      if (data) {
        setR(data);
        setLoading(false);
        return;
      }

      let localData: any[] = [];
      try {
        localData = JSON.parse(localStorage.getItem("ncfrmi_local_registrants") || "[]");
      } catch (e) {
        console.error(e);
      }
      const found = localData.find(r => r.id === id);
      if (found) {
        setR(found);
      } else {
        if (error) toast.error(error.message);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (r?.reference) {
      try {
        const stored = JSON.parse(localStorage.getItem("ncfrmi_captured_biometrics") || "{}");
        if (stored[r.reference]) {
          setBiometrics(stored[r.reference]);
        }
      } catch (e) {
        console.error("Failed to load biometrics locally:", e);
      }
    }
  }, [r]);

  return (
    <Layout>
      <section className="container-page py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/registrants"><ArrowLeft className="mr-2 h-4 w-4" /> All registrants</Link>
        </Button>

        {loading ? (
          <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>
        ) : !r ? (
          <Card className="p-10 text-center text-muted-foreground">Registrant not found.</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-[1fr_150px]">
                {/* Left Side: Info */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.reference}</div>
                  <h1 className="font-display text-3xl font-bold text-primary">{r.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Enrolled {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Info k="Gender" v={r.gender} />
                    <Info k="Date of birth" v={new Date(r.dob).toLocaleDateString()} />
                    <Info k="Nationality" v={r.nationality} />
                    <Info k="State of origin" v={r.state_origin} />
                    <Info k="LGA" v={r.lga} />
                    <Info k="Dependants" v={String(r.dependants)} />
                    <Info k="Phone" v={r.phone} icon={<Phone className="h-4 w-4" />} />
                    <Info k="Address" v={r.address} icon={<MapPin className="h-4 w-4" />} />
                  </dl>

                  <div className="mt-6">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Circumstances</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{r.circumstances}</p>
                  </div>
                </div>

                {/* Right Side: Biometrics (Top Right Corner) */}
                <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-3 shadow-sm self-start">
                  <div className="relative group overflow-hidden rounded-lg border bg-background shadow-sm">
                    {biometrics?.face ? (
                      <img
                        src={biometrics.face}
                        alt="Captured Face"
                        className="h-28 w-28 object-cover"
                      />
                    ) : r.face_captured ? (
                      <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 text-center bg-accent/5 p-2 text-[10px] text-accent font-medium">
                        <Camera className="h-6 w-6 opacity-75" />
                        <span>Encrypted Cloud Photo</span>
                      </div>
                    ) : (
                      <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Camera className="h-6 w-6 opacity-30" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Facial Photo</div>
                  
                  <div className="mt-1 h-[1px] w-full bg-border" />
                  
                  <div className="relative overflow-hidden rounded-lg border bg-slate-950 p-1 shadow-sm mt-1">
                    {biometrics?.thumb ? (
                      <img
                        src={biometrics.thumb}
                        alt="Captured Thumb"
                        className="h-14 w-14 object-contain brightness-115 filter hue-rotate-15"
                      />
                    ) : r.thumb_captured ? (
                      <div className="flex h-14 w-14 flex-col items-center justify-center gap-1 text-center bg-emerald-950/20 text-[10px] text-emerald-400 font-medium">
                        <Fingerprint className="h-6 w-6 opacity-75 text-emerald-400" />
                        <span>Encrypted Cloud Scan</span>
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Fingerprint className="h-6 w-6 opacity-30" />
                        <span>No Scan</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Thumbprint</div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-3 font-display font-semibold text-primary">Biometric verification</div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="flex items-center gap-2 text-sm"><Camera className="h-4 w-4" /> Facial capture</span>
                  <Badge variant={r.face_captured ? "default" : "outline"}>{r.face_captured ? "Captured" : "Pending"}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-md border p-3">
                  <span className="flex items-center gap-2 text-sm"><Fingerprint className="h-4 w-4" /> Thumbprint</span>
                  <Badge variant={r.thumb_captured ? "default" : "outline"}>{r.thumb_captured ? "Captured" : "Pending"}</Badge>
                </div>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2 font-display font-semibold text-primary">
                  <Users className="h-4 w-4" /> Household
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.dependants} dependant{r.dependants === 1 ? "" : "s"} declared at enrolment.
                </p>
              </Card>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

const Info = ({ k, v, icon }: { k: string; v: string; icon?: React.ReactNode }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
    <dd className="mt-1 flex items-center gap-2 text-sm">{icon}{v || "—"}</dd>
  </div>
);

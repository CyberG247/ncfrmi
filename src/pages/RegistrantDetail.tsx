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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("registrants").select("*").eq("id", id!).maybeSingle();
      if (error) toast.error(error.message);
      setR(data);
      setLoading(false);
    })();
  }, [id]);

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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.reference}</div>
                  <h1 className="font-display text-3xl font-bold text-primary">{r.full_name}</h1>
                  <Badge variant="outline" className="mt-2 capitalize">{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Enrolled {new Date(r.created_at).toLocaleString()}
                </div>
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

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TYPES = [
  { v: "asylum", l: "Asylum Application" },
  { v: "refugee", l: "Refugee Status Request" },
  { v: "idp", l: "IDP Registration" },
  { v: "returnee", l: "Returnee Reintegration" },
];

export default function NewApplication() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [type, setType] = useState(params.get("type") || "asylum");
  const [submitting, setSubmitting] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const isUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (user && isUuid) {
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
        .then(({ data }) => data?.full_name && setProfileName(data.full_name));
    } else {
      setProfileName("Demo User");
    }
  }, [user]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    setSubmitting(true);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      // Simulate success for mock users
      const mockRef = `NCF-APP-${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const mockId = Math.random().toString(36).slice(2, 9);
      
      const localApps = JSON.parse(localStorage.getItem("ncfrmi_local_applications") || "[]");
      localApps.push({
        id: mockId,
        reference: mockRef,
        user_id: user.id,
        type: type,
        full_name: String(f.get("full_name") || ""),
        phone: String(f.get("phone") || ""),
        state: String(f.get("state") || ""),
        lga: String(f.get("lga") || ""),
        reason: String(f.get("reason") || ""),
        status: "submitted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      localStorage.setItem("ncfrmi_local_applications", JSON.stringify(localApps));
      
      setSubmitting(false);
      toast.success(`Application ${mockRef} submitted (Demo Mode)`);
      nav(`/dashboard`);
      return;
    }

    const { data, error } = await supabase.from("applications").insert({
      user_id: user.id,
      type: type as any,
      full_name: String(f.get("full_name") || ""),
      phone: String(f.get("phone") || ""),
      state: String(f.get("state") || ""),
      lga: String(f.get("lga") || ""),
      reason: String(f.get("reason") || ""),
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Application ${data.reference} submitted`);
    nav(`/dashboard/applications/${data.id}`);
  };

  return (
    <Layout>
      <PageHero eyebrow="New Application" title="Submit a new case" description="Your case will receive a unique reference and live tracking." />
      <section className="container-page py-12">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-7">
            <form onSubmit={onSubmit} className="grid gap-5">
              <div>
                <label className="text-sm font-medium">Application type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-sm font-medium">Full name</label><Input name="full_name" required defaultValue={profileName} className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">Phone</label><Input name="phone" required type="tel" className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">State</label><Input name="state" required className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">LGA / Town</label><Input name="lga" required className="mt-1.5" /></div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason / Description</label>
                <Textarea name="reason" required rows={5} className="mt-1.5" placeholder="Briefly describe your circumstances…" />
              </div>
              <Button type="submit" size="lg" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</Button>
              <p className="text-xs text-muted-foreground">You'll receive real-time updates as officers review your case.</p>
            </form>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

import { useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ApplicationReceivedDialog from "@/components/site/ApplicationReceivedDialog";
import { browserNotify, ensureNotificationPermission } from "@/lib/notify";

const categories = ["Displacement", "Missing Persons", "Urgent Humanitarian Need", "Protection Concern", "Other"];

export default function Report() {
  const [cat, setCat] = useState(categories[0]);
  const [open, setOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(true);
    toast.success("Report received", { description: "Our zonal team has been notified and will respond." });
    const allowed = await ensureNotificationPermission();
    if (allowed) browserNotify("NCFRMI — Report Received", "Your report has been received. We will notify you of progress.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <Layout>
      <PageHero eyebrow="Report Incident" title="Request urgent help or report displacement" description="All reports are routed securely to the nearest zonal response team." />
      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="p-7">
              <AlertTriangle className="h-7 w-7" />
              <h3 className="mt-3 font-display text-xl font-bold">In an emergency</h3>
              <p className="mt-2 text-sm text-accent-foreground/90">If lives are at immediate risk, please call our 24/7 helpline:</p>
              <a href="tel:+2349461000" className="mt-3 block font-display text-2xl font-bold">+234 (0)9 461 0000</a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-7">
              <form onSubmit={onSubmit} className="grid gap-5">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button type="button" key={c} onClick={() => setCat(c)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-base ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="text-sm font-medium">Full name</label><Input required className="mt-1.5" /></div>
                  <div><label className="text-sm font-medium">Phone number</label><Input required type="tel" className="mt-1.5" /></div>
                  <div><label className="text-sm font-medium">State</label><Input required className="mt-1.5" /></div>
                  <div><label className="text-sm font-medium">LGA / Town</label><Input required className="mt-1.5" /></div>
                </div>
                <div>
                  <label className="text-sm font-medium">Describe the incident</label>
                  <Textarea required rows={5} className="mt-1.5" placeholder="Provide as much detail as possible (who, what, when, where)…" />
                </div>
                <Button type="submit" size="lg">Submit report</Button>
                <p className="text-xs text-muted-foreground">Your information is encrypted and shared only with authorised humanitarian responders.</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <ApplicationReceivedDialog
        open={open}
        onOpenChange={setOpen}
        title="Report Received"
        message="Your incident report has been received. Our zonal response team has been notified and you will receive progress updates via email, SMS, and in-app notifications."
        continueLabel="Done"
      />
    </Layout>
  );
}

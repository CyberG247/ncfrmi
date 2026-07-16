import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Users, HeartHandshake, FileText } from "lucide-react";
import ApplicationFormDialog from "@/components/site/ApplicationFormDialog";

const types = [
  { id: "asylum", icon: ShieldCheck, title: "Asylum Application", desc: "For persons fleeing persecution and seeking international protection in Nigeria.", time: "2 minutes" },
] as const;

const steps = [
  "Bio-Data Details",
  "Biometrics Capture",
  "Instant Certificate Issuance",
];

export default function Apply() {
  const [params] = useSearchParams();
  const preset = params.get("type");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<{ id: typeof types[number]["id"]; title: string } | null>(null);

  const handleStart = (id: typeof types[number]["id"], title: string) => {
    setActive({ id, title });
    setOpen(true);
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Online Application Portal"
        title="Apply securely from anywhere in Nigeria"
        description="Submit your details, verify your biometrics, and instantly generate a preview asylum certificate for demonstration purposes."
      />

      <section className="container-page py-16 flex flex-col items-center">
        <h2 className="font-display text-2xl text-center">Asylum Application Portal</h2>
        <p className="text-muted-foreground text-sm text-center mt-2 max-w-md">Please review the details below to initiate your official asylum application profile.</p>
        
        <div className="mt-8 w-full max-w-xl">
          {types.map(({ id, icon: Icon, title, desc, time }) => (
            <Card key={id} className="transition-base hover:-translate-y-1 hover:shadow-card border border-primary/25 bg-card shadow-elegant">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary flex-shrink-0"><Icon className="h-6 w-6" /></div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                      <span>⏱</span> Estimated completion time: <span className="font-semibold text-foreground">{time}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => handleStart(id, title)} size="lg" className="flex-1 hover-lift">
                    Start New Application <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex-1 hover-lift">
                    <Link to="/login">Continue Saved</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="container-page py-16">
          <h2 className="font-display text-2xl">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="font-display text-3xl font-bold text-primary">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-medium">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {active && (
        <ApplicationFormDialog
          open={open}
          onOpenChange={setOpen}
          type={active.id}
          typeLabel={active.title}
        />
      )}
    </Layout>
  );
}

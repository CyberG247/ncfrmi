import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Users, HeartHandshake, FileText } from "lucide-react";

const types = [
  { id: "asylum", icon: ShieldCheck, title: "Asylum Application", desc: "For persons fleeing persecution and seeking international protection in Nigeria.", time: "15–25 minutes" },
  { id: "refugee", icon: FileText, title: "Refugee Status Request", desc: "For recognition of refugee status under Nigerian and international law.", time: "20 minutes" },
  { id: "idp", icon: Users, title: "IDP Registration", desc: "For Nigerians displaced within the country due to conflict or disaster.", time: "10–15 minutes" },
  { id: "returnee", icon: HeartHandshake, title: "Returnee Reintegration", desc: "For Nigerian returnees seeking livelihood and reintegration support.", time: "15 minutes" },
];

const steps = [
  "Account Creation",
  "Personal Information",
  "Biometric / Identity Details",
  "Reason for Displacement",
  "Document Upload",
  "Review & Submit",
  "Application Tracking",
];

export default function Apply() {
  const [params] = useSearchParams();
  const preset = params.get("type");

  return (
    <Layout>
      <PageHero
        eyebrow="Online Application Portal"
        title="Apply securely from anywhere in Nigeria"
        description="Create an account, save your progress, upload documents, and track your case end-to-end."
      />

      <section className="container-page py-16">
        <h2 className="font-display text-2xl">Choose your application type</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {types.map(({ id, icon: Icon, title, desc, time }) => (
            <Card key={id} className={`transition-base hover:-translate-y-1 hover:shadow-card ${preset === id ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                    <div className="mt-3 text-xs text-muted-foreground">⏱ Estimated time: {time}</div>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button asChild className="flex-1"><Link to={`/register?type=${id}`}>Start <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  <Button asChild variant="outline" className="flex-1"><Link to="/login">Continue saved</Link></Button>
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
    </Layout>
  );
}

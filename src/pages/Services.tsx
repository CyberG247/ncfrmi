import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { ShieldCheck, FileText, Users, MapPin, HeartHandshake, AlertTriangle } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Protection & Asylum Services", desc: "Refugee status determination, non-refoulement protection, family tracing and reunification." },
  { icon: HeartHandshake, title: "Rehabilitation & Relief", desc: "Camp management, NFI distribution, healthcare, psychosocial support and education." },
  { icon: Users, title: "Migration Management", desc: "Policy coordination, counter-trafficking, diaspora engagement and labour migration." },
  { icon: FileText, title: "Legal Aid & Documentation", desc: "Identity cards, birth registration, refugee certificates and pro bono legal counsel." },
  { icon: MapPin, title: "Durable Solutions", desc: "Voluntary repatriation, local integration and third-country resettlement support." },
  { icon: AlertTriangle, title: "Returnee Reintegration", desc: "Reception, profiling, livelihoods and community-based reintegration." },
];

export default function Services() {
  return (
    <Layout>
      <PageHero
        eyebrow="Services"
        title="Humanitarian services, end-to-end"
        description="From first contact to durable solutions, NCFRMI delivers a full lifecycle of humanitarian and legal support."
      />
      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

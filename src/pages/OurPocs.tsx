import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Users, HeartHandshake, FileText, AlertOctagon } from "lucide-react";
import Reveal from "@/components/site/Reveal";

const pocCategories = [
  {
    icon: ShieldCheck,
    title: "Refugees",
    description: "Individuals who have fled their home countries due to a well-founded fear of persecution, conflict, generalized violence, or other circumstances. Nigeria currently hosts thousands of refugees, primarily from Cameroon, Niger, and Central African Republic.",
    stats: "Over 85,000 recognized refugees",
    actions: ["International protection", "Refugee Status Determination (RSD)", "Access to education & healthcare"]
  },
  {
    icon: MapPin,
    title: "Internally Displaced Persons (IDPs)",
    description: "People forced to flee their homes as a result of armed conflict, generalized violence, human rights violations, or natural disasters, but who remain within Nigeria's borders. NCFRMI coordinates camp management and durable solutions.",
    stats: "Approx. 3.4 Million IDPs",
    actions: ["Camp density monitoring", "Rehabilitation & relief logistics", "Resettlement and return support"]
  },
  {
    icon: Users,
    title: "Migrants",
    description: "Persons moving from their habitual place of residence, either cross-border or within Nigeria. NCFRMI acts as the national coordinator for migration policy, working to ensure safe, orderly, and regular migration.",
    stats: "Coordinating 15+ agencies",
    actions: ["National Migration Policy", "Smuggling and trafficking deterrence", "Regional ECOWAS integration"]
  },
  {
    icon: FileText,
    title: "Asylum Seekers",
    description: "Individuals seeking international protection whose claims to refugee status have not yet been finally determined by the Commission. NCFRMI oversees their secure registration and case files.",
    stats: "Streamlined digital intake",
    actions: ["Digital portal applications", "Interview scheduling", "Interim protection documents"]
  },
  {
    icon: HeartHandshake,
    title: "Returnees",
    description: "Nigerian citizens returning from abroad (either voluntarily or through repatriation agreements) who require support to reintegrate into their local communities.",
    stats: "12,000+ assisted in 2025",
    actions: ["Vocational training", "Livelihood support packages", "Psychosocial counselling"]
  },
  {
    icon: AlertOctagon,
    title: "Stateless Persons",
    description: "Individuals who are not considered as nationals by any State under the operation of its law. NCFRMI collaborates on national actions to identify, prevent, and end statelessness in Nigeria.",
    stats: "Global campaign alignment",
    actions: ["Identity documentation", "Legal status reviews", "Birth registration advocacy"]
  }
];

export default function OurPocs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get("type") || "all";

  const filteredCategories = useMemo(() => {
    if (typeParam === "all") return pocCategories;
    return pocCategories.filter((cat) => {
      if (typeParam === "refugees") return cat.title === "Refugees";
      if (typeParam === "idps") return cat.title.includes("IDPs") || cat.title.includes("Internally Displaced");
      if (typeParam === "migrants") return cat.title === "Migrants";
      if (typeParam === "asylum-seekers") return cat.title === "Asylum Seekers";
      if (typeParam === "returnees") return cat.title === "Returnees";
      if (typeParam === "stateless") return cat.title === "Stateless Persons";
      return true;
    });
  }, [typeParam]);

  return (
    <Layout>
      <PageHero
        eyebrow="Persons of Concern (PoCs)"
        title="Our Mandated Target Populations"
        description="NCFRMI provides care, durable solutions, and legal protection to six distinct categories of displaced and vulnerable persons."
      />

      <section className="container-page py-16">
        <Reveal className="mx-auto max-w-2xl text-center mb-12">
          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1">
            Statutory Mandate
          </Badge>
          <h2 className="font-display text-3xl font-bold mt-3">Who we protect and assist</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Our activities comply with the 1951 Geneva Convention, the 1969 OAU Convention, and the 2009 Kampala Convention on IDPs.
          </p>
        </Reveal>

        {/* Category Tabs */}
        <Reveal className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {[
            { id: "all", label: "All POCs" },
            { id: "refugees", label: "Refugees" },
            { id: "idps", label: "IDPs" },
            { id: "migrants", label: "Migrants" },
            { id: "asylum-seekers", label: "Asylum Seekers" },
            { id: "returnees", label: "Returnees" },
            { id: "stateless", label: "Stateless Persons" }
          ].map((tab) => {
            const isActive = typeParam === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchParams({ type: tab.id })}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md border transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-white border-emerald-650 shadow-elegant"
                    : "text-muted-foreground hover:bg-emerald-500/[0.04] hover:text-emerald-800 hover:border-emerald-500/10 border-border bg-card"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((poc, i) => {
            const Icon = poc.icon;
            return (
              <Reveal key={poc.title} delay={i * 80} variant="scale">
                <Card className="h-full border-border/80 bg-card hover-lift hover-glow flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-semibold text-[10px] tracking-wider">
                          {poc.stats}
                        </Badge>
                      </div>
                      
                      <h3 className="font-display font-extrabold text-lg text-foreground mt-4">{poc.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {poc.description}
                      </p>
                    </div>

                    <div className="mt-6 border-t pt-4 space-y-2">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary block">Core Interventions:</span>
                      <ul className="space-y-1.5">
                        {poc.actions.map((act) => (
                          <li key={act} className="text-[10px] text-foreground/80 flex items-center gap-1.5 font-medium">
                            <span className="h-1 w-1.5 rounded-full bg-primary" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* EMERGENCY HELP BANNER */}
      <section className="bg-muted/40 border-t border-b border-border/70 py-12">
        <div className="container-page flex flex-col md:flex-row justify-between items-center gap-6 max-w-4xl">
          <div>
            <h3 className="font-display font-bold text-lg">Are you a Person of Concern in need of immediate assistance?</h3>
            <p className="text-xs text-muted-foreground mt-1">Our field officers and protection desks are active 24/7 across the federation.</p>
          </div>
          <div className="flex gap-3">
            <a href="/apply" className="rounded-md bg-primary text-primary-foreground font-bold px-4 py-2 text-xs shadow-md hover:bg-primary/90 transition-colors">
              Apply online
            </a>
            <a href="/contact" className="rounded-md border border-border bg-background text-foreground font-bold px-4 py-2 text-xs shadow-sm hover:bg-muted transition-colors">
              Contact office
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

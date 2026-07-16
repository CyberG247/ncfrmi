import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, HeartHandshake, Users, Landmark, Wrench, GraduationCap, Sprout, Home } from "lucide-react";
import Reveal from "@/components/site/Reveal";

const workInterventions = [
  {
    icon: ShieldCheck,
    title: "Refugee Protection & Status Determination",
    desc: "Overseeing the legal frameworks that grant asylum to fleeing populations. We coordinate status determination (RSD) panels and issue legal documentation for refugees and asylum seekers in Nigeria.",
    program: "Refugee Registry Program"
  },
  {
    icon: HeartHandshake,
    title: "Emergency Rehabilitation & Relief",
    desc: "Providing immediate humanitarian relief following displacement incidents. We distribute food, Non-Food Items (NFIs), healthcare services, and manage camp operations in partnership with NEMA and international aid bodies.",
    program: "Camp Assistance Initiative"
  },
  {
    icon: Users,
    title: "Migration Policy Coordination",
    desc: "NCFRMI is Nigeria's focal point for migration policy, leading inter-agency dialogues, drafting national migration framework codes, and partnering with IOM to coordinate repatriation and returnee integration.",
    program: "National Migration Policy"
  },
  {
    icon: Wrench,
    title: "Livelihood & Skills Reintegration",
    desc: "Empowering returnees and IDPs with vocational skills. We administer vocational training programs, technology hubs, and business starter kits (sewing, carpentry, welding) to foster financial self-reliance.",
    program: "Youth Empowerment & Reintegration (YERP)"
  },
  {
    icon: Sprout,
    title: "Agricultural Support & Food Security",
    desc: "Deploying farm lands, fertilizers, tractors, and agricultural starter inputs to IDPs and returnees in farming-intensive communities to boost food security and community resilience.",
    program: "PoC Farmers Initiative"
  },
  {
    icon: Home,
    title: "Durable Resettlement Solutions",
    desc: "Designing and building permanent housing estates and integration communities for IDPs and returned refugees, moving them from temporary tents into dignified concrete homes.",
    program: "National IDP Resettlement Cities"
  }
];

export default function OurWork() {
  return (
    <Layout>
      <PageHero
        eyebrow="Our Work"
        title="Humanitarian Interventions & Durable Solutions"
        description="NCFRMI designs and implements comprehensive programs ranging from immediate emergency relief to permanent resettlement and vocational empowerment."
      />

      {/* CORE FRAMEWORK */}
      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1">
              Mission Execution
            </Badge>
            <h2 className="font-display text-3xl font-bold mt-4">Integrating international best practices for durable solutions</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Our interventions are structured around the concept of "Durable Solutions" defined by the UNHCR. We believe that displacement shouldn't be a permanent state. By focusing on vocational training, education, agricultural aid, and building permanent "Resettlement Cities", we empower Persons of Concern to regain their autonomy and contribute to the national economy.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex gap-3 items-start">
                <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-sm">Education &amp; Scholarships</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">NCFRMI sponsors tuition and basic kits for refugee children in primary and secondary schools across host zones.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Landmark className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-sm">Policy &amp; Advocacy</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">We push for local integration laws, protecting refugees' right to work and open businesses in Nigeria.</p>
                </div>
              </div>
            </div>
          </Reveal>
          
          <Reveal variant="scale" className="grid gap-4 grid-cols-2">
            <div className="bg-primary/5 rounded-2xl border p-6 text-center space-y-2">
              <span className="font-display text-3xl font-black text-primary block">3.4M</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">IDPs Supported</span>
            </div>
            <div className="bg-indigo-500/5 rounded-2xl border p-6 text-center space-y-2">
              <span className="font-display text-3xl font-black text-indigo-650 block">85K+</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Refugees Documented</span>
            </div>
            <div className="bg-emerald-500/5 rounded-2xl border p-6 text-center space-y-2">
              <span className="font-display text-3xl font-black text-emerald-650 block">37</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Zonal State Hubs</span>
            </div>
            <div className="bg-amber-500/5 rounded-2xl border p-6 text-center space-y-2">
              <span className="font-display text-3xl font-black text-amber-650 block">12K+</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Vocational Graduates</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* DETAILED INTERVENTIONS */}
      <section className="bg-muted/40 border-t border-border/70 py-16">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="font-display text-3xl font-bold">Our Operational Programs</h2>
            <p className="text-xs text-muted-foreground mt-1">Providing care, protection, and long-term economic independence.</p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workInterventions.map((work, idx) => {
              const Icon = work.icon;
              return (
                <Reveal key={work.title} delay={idx * 85} variant="scale">
                  <Card className="h-full border-border/80 bg-card hover-lift hover-glow flex flex-col justify-between">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold text-[9px] uppercase tracking-wider">
                            {work.program}
                          </Badge>
                        </div>
                        <h3 className="font-display font-extrabold text-sm text-foreground mt-4">{work.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {work.desc}
                        </p>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t flex justify-end">
                        <a href="/contact" className="text-xs font-semibold text-primary hover:underline">
                          Inquire about program →
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}

import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/site/Reveal";
import { Shield, ChevronRight, Landmark, Calendar } from "lucide-react";

export default function WhoWeAre() {
  return (
    <Layout>
      <PageHero
        eyebrow="About Us"
        title="Who We Are"
        description="The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) — protecting and empowering Persons of Concern since 1989."
      />

      {/* WHO WE ARE STATEMENT */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal variant="scale">
            <Card className="border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-elegant p-4">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-primary">Our Identity</h2>
                </div>
                <p className="text-base leading-relaxed text-foreground/80">
                  The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) is the premier Federal Government Agency in Nigeria mandated to provide care, durable solutions, and humanitarian assistance to all Persons of Concern (PoCs).
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Established by Decree 52 of 1989, our operations span across all 36 states and the Federal Capital Territory (FCT), delivering structured protection, legal aid, relief materials, and socio-economic reintegration programs in coordination with global partners like the UNHCR and IOM.
                </p>
                <div className="border-t pt-6 flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Est. 1989</span>
                  <span>•</span>
                  <span>Federal Republic of Nigeria</span>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={120}>
            <div className="space-y-6">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Core Mandate Focus</div>
              <h2 className="font-display text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                Caring for Nigeria's most vulnerable populations
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our operations are built on a solid foundation of empathy, accountability, and international treaty compliance. We manage coordinate networks to respond to emergencies, rehabilitate displaced families, and create sustainable developmental pathways.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {[
                  { icon: Landmark, title: "Federal Institution", desc: "Coordinates national policy on displacement and asylum." },
                  { icon: Calendar, title: "Decades of Action", desc: "Active protection services and camp management since 1989." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-border/80 bg-card hover-glow">
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-display font-bold text-xs text-foreground">{title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HISTORY & MILESTONES */}
      <section className="bg-muted/40 py-16 border-t border-b border-border/60">
        <div className="container-page">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Journey</div>
            <h2 className="font-display text-3xl mt-2 font-bold">History &amp; Milestones</h2>
            <p className="text-xs text-muted-foreground mt-1">Key evolutionary milestones in the mandate and reach of the Commission.</p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1989", "Established by Decree 52 of 1989, originally focusing on managing refugee matters under the presidency."],
              ["2002", "Mandate formally expanded to cover national coordination for migration policy and anti-smuggling partnerships."],
              ["2009", "Internally Displaced Persons (IDPs) and rehabilitation/camp density management added to core functions."],
              ["Today", "A unified federal commission with state hubs, fully digitized platforms, and comprehensive support services."]
            ].map(([year, text], idx) => (
              <Reveal key={year} delay={idx * 80} variant="scale">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card hover-glow h-full flex flex-col justify-between">
                  <div>
                    <span className="font-display text-2xl font-black text-primary block">{year}</span>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase mt-4">
                    <span>Milestone</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

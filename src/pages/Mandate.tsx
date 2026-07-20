import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/site/Reveal";
import { Eye, Flame, Compass, Target, HelpCircle } from "lucide-react";

export default function Mandate() {
  return (
    <Layout>
      <PageHero
        eyebrow="Core Values"
        title="Our Mandate"
        description="The statutory responsibility, long-term vision, and core mission guiding NCFRMI in protecting and integrating displaced populations."
      />

      {/* CORE STATEMENTS: Vision, Mission, Strategy */}
      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Vision */}
          <Reveal variant="scale">
            <Card className="border-border/70 hover-glow h-full">
              <CardContent className="p-8 space-y-4">
                <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400 w-fit">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Vision</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  To be a leading world-class humanitarian organization that is operationally vibrant, efficient, and effective in protecting, assisting, and delivering durable and sustainable solutions to all Persons of Concern (PoCs).
                </p>
              </CardContent>
            </Card>
          </Reveal>

          {/* Mission */}
          <Reveal delay={100} variant="scale">
            <Card className="border-border/70 hover-glow h-full">
              <CardContent className="p-8 space-y-4">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 w-fit">
                  <Flame className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Mission</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  To integrate international best practices in the mobilization of internal and external capacities for effective and efficient delivery of durable solutions to enhance the protection and assistance of PoCs.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          {/* Strategy */}
          <Reveal delay={200} variant="scale">
            <Card className="border-border/70 hover-glow h-full">
              <CardContent className="p-8 space-y-4">
                <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 w-fit">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Strategy</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  To integrate international best practices in the mobilization of internal and external capacities for effective and efficient delivery of durable solutions to enhance the protection and assistance of PoCs.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* STATUTORY MANDATE DETAILS */}
      <section className="bg-muted/40 py-16 border-t border-b border-border/60">
        <div className="container-page max-w-4xl">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-primary">Statutory Obligations & Functions</h2>
            </div>
            <div className="space-y-6 text-sm text-foreground/80 leading-relaxed bg-background p-8 rounded-2xl border shadow-sm">
              <p>
                The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) operates under strict legislative directives to govern, safeguard, and create resettlement pathways for vulnerable displaced groups in Nigeria.
              </p>
              <h3 className="font-display font-bold text-base text-foreground mt-4">Key Functional Areas:</h3>
              <ul className="space-y-3.5 pl-5 list-disc text-muted-foreground">
                <li>
                  <strong className="text-foreground">Refugee Status Determination (RSD):</strong> Processing asylum seeker applications and granting official refugee status under international conventions.
                </li>
                <li>
                  <strong className="text-foreground">Emergency Relief & Rehabilitation:</strong> Establishing camp coordination and distributing food, medical aid, and essential shelter support to Internally Displaced Persons (IDPs).
                </li>
                <li>
                  <strong className="text-foreground">National Migration Management:</strong> Developing cohesive migration frameworks, assisting voluntary returns, and providing rehabilitation for survivors of trafficking.
                </li>
                <li>
                  <strong className="text-foreground">Durable Solutions Formulation:</strong> Implementing sustainable integration, voluntary repatriation, local settlement, and skill acquisition schemes.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}

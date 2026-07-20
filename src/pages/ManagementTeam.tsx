import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import commissioner from "@/assets/commissioner.jpg";
import Reveal from "@/components/site/Reveal";

const managementTeam = [
  {
    name: "Hon. Dr. Aliyu Tijani Ahmed",
    designation: "Federal Commissioner / CEO",
    image: commissioner,
    bio: "Leads the Commission's reform and digital transformation agenda, bringing decades of public service experience to advance humanitarian relief and durable solutions across Nigeria.",
    isHfc: true
  },
  {
    name: "Mr. Bello Alhassan",
    designation: "Director, Refugee Affairs",
    bio: "Coordinates Refugee Status Determination (RSD), asylum seeker registration, and international protection frameworks in collaboration with UNHCR.",
    fallback: "BA"
  },
  {
    name: "Mrs. Margaret Ngozi",
    designation: "Director, Internally Displaced Persons (IDPs)",
    bio: "Manages IDP camps coordination, emergency relief logistics, and the implementation of resettlement and reintegration programs.",
    fallback: "MN"
  },
  {
    name: "Mr. Charles Odemwingie",
    designation: "Director, Migration Affairs",
    bio: "Supervises the national migration policy, returnee repatriation coordination, and rehabilitation programs for survivors of trafficking.",
    fallback: "CO"
  },
  {
    name: "Alhaji Muhammad Musa",
    designation: "Director, Human Resource Management",
    bio: "Oversees personnel recruitment, training, staff welfare, administrative compliance, and organizational development.",
    fallback: "MM"
  },
  {
    name: "Mrs. Zainab Gwandu",
    designation: "Director, Finance & Accounts",
    bio: "Manages financial planning, budget execution, audits, and international funding compliance for humanitarian projects.",
    fallback: "ZG"
  },
  {
    name: "Dr. Jude Nwosu",
    designation: "Director, Planning, Research & Statistics",
    bio: "Drives data-centric analytics, biometric registry architectures, field mapping surveys, and monitoring & evaluation (M&E).",
    fallback: "JN"
  },
  {
    name: "Barr. Halima Ibrahim",
    designation: "Legal Adviser / Head of Legal Unit",
    bio: "Provides legal counsel on domestic and international refugee laws, treaty compliance, and operational contracts.",
    fallback: "HI"
  }
];

export default function ManagementTeam() {
  return (
    <Layout>
      <PageHero
        eyebrow="Leadership"
        title="Management Team"
        description="Meet the executive leadership guiding NCFRMI's operations, research, policy enforcement, and humanitarian programs."
      />

      <section className="container-page py-16">
        <Reveal>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">Our Leaders</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-10">Commission Leadership &amp; Board Directors</h2>
        </Reveal>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {managementTeam.map((staff, idx) => (
            <Reveal key={staff.name} delay={idx * 50} variant="scale">
              <Card className={`h-full overflow-hidden border-border/70 transition-all duration-300 hover-lift hover-glow flex flex-col ${staff.isHfc ? 'ring-2 ring-primary/45 bg-primary/5 dark:bg-primary-deep/5 md:col-span-2 lg:col-span-2' : ''}`}>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className={`border border-border shadow-md ${staff.isHfc ? 'h-20 w-20' : 'h-16 w-16'}`}>
                        {staff.image ? (
                          <AvatarImage src={staff.image} alt={staff.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{staff.fallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className={`font-display font-extrabold ${staff.isHfc ? 'text-lg sm:text-xl text-primary' : 'text-sm sm:text-base text-foreground'}`}>
                          {staff.name}
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{staff.designation}</p>
                        {staff.isHfc && (
                          <Badge className="mt-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                            HFC / CEO
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                      {staff.bio}
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </Layout>
  );
}

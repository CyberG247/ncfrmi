import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import commissioner from "@/assets/commissioner.jpg";
import Reveal from "@/components/site/Reveal";

const commissionerStaff = {
  name: "Hon. Dr. Aliyu Tijani Ahmed",
  designation: "Federal Commissioner / CEO",
  image: commissioner,
  isHfc: true
};

const managementTeam = [
  // Directors
  {
    name: "Catherine Udida MNI",
    designation: "Director, Migrant Affairs Department",
    fallback: "CU"
  },
  {
    name: "Bello M. Bello",
    designation: "Director, Human Resource Management",
    fallback: "BB"
  },
  {
    name: "Saadatu Baba Shettima",
    designation: "Director, Planning, Research & Documentation",
    fallback: "SS"
  },
  {
    name: "Fatima M.D",
    designation: "Director, Internally Displaced Persons Department",
    fallback: "FD"
  },
  {
    name: "Funmilayo Bara",
    designation: "Director, Procurement Department",
    fallback: "FB"
  },
  {
    name: "Asoka Margaret Maryamu",
    designation: "Director, Strategic Communication Department",
    fallback: "SC"
  },
  // Deputy Directors
  {
    name: "Jummai Ngarama Modu",
    designation: "Deputy Director, Special Duties Department",
    fallback: "JM"
  },
  {
    name: "Titus Murdakai",
    designation: "Deputy Director, Refugee Affairs Department",
    fallback: "TM"
  },
  {
    name: "Habibu Labaran",
    designation: "Deputy Director, Legal",
    fallback: "HL"
  },
  {
    name: "Abdullahi Yakubu",
    designation: "Deputy Director, Finance & Account Department",
    fallback: "FA"
  },
  {
    name: "John Naanmang Dama",
    designation: "Deputy Director, Audit Unit",
    fallback: "JD"
  }
];


export default function ManagementTeam() {
  return (
    <Layout>
      <PageHero
        eyebrow="Leadership"
        title="Management Team"
        description="Executive leadership and heads of departments steering the Commission's humanitarian programs and operations."
      />

      <section className="container-page py-16 space-y-16">
        {/* Federal Commissioner Section at the Top */}
        <div className="flex flex-col items-center">
          <Reveal>
            <div className="text-center space-y-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-red-600">The Honorable Federal Commissioner</h2>
            </div>
          </Reveal>

          <div className="w-full max-w-md mt-8">
            <Reveal variant="scale">
              <Card className="overflow-hidden border border-primary/20 bg-primary/5 dark:bg-primary-deep/5 shadow-elegant p-8 flex flex-col items-center text-center space-y-4 hover:shadow-glow transition-all duration-300">
                <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
                  <AvatarImage src={commissionerStaff.image} alt={commissionerStaff.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">FC</AvatarFallback>
                </Avatar>
                
                <div className="space-y-1.5">
                  <h3 className="font-display font-extrabold text-xl text-primary">
                    {commissionerStaff.name}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{commissionerStaff.designation}</p>
                  <Badge className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 mt-2">
                    HFC / CEO
                  </Badge>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>

        {/* Separator / Section Title */}
        <div className="border-t border-border pt-12">
          <Reveal>
            <div className="text-center space-y-2 mb-10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Management</div>
              <h3 className="font-display text-xl md:text-2xl font-bold">Directors of Departments &amp; Units</h3>
            </div>
          </Reveal>

          {/* Management / Directors Grid below the HFC */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {managementTeam.map((staff, idx) => (
              <Reveal key={staff.name + idx} delay={idx * 40} variant="scale">
                <Card className="h-full overflow-hidden border border-border/70 p-6 flex flex-col items-center text-center space-y-4 hover-lift hover-glow transition-all duration-300">
                  <Avatar className="h-20 w-20 border border-border shadow-md">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{staff.fallback}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                    <h4 className={`font-display font-bold text-sm ${staff.name === "Vacant" ? "text-muted-foreground italic" : "text-foreground"}`}>
                      {staff.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {staff.designation}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

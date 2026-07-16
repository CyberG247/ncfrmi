import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/ncfrmi-logo.png";
import commissioner from "@/assets/commissioner.jpg";
import Reveal from "@/components/site/Reveal";
import { Shield, Eye, Flame, Compass, Users, Network, ChevronRight, Info } from "lucide-react";

// Management data
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

// Organogram structure
const departmentsData = [
  {
    id: "hfc",
    name: "Office of the Honorable Federal Commissioner / CEO",
    role: "Overall administration, policy direction & strategic planning",
    color: "bg-primary text-primary-foreground border-primary",
    subUnits: []
  },
  {
    id: "advisory",
    name: "Specialized & Advisory Units",
    role: "Direct support and compliance reporting to the HFC",
    color: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300",
    isUnitGroup: true,
    subUnits: [
      { name: "Legal Unit", desc: "Treaty compliance & legal counsel" },
      { name: "Internal Audit Unit", desc: "Financial compliance & audit" },
      { name: "Procurement Unit", desc: "Tenders, supply chain & contracts" },
      { name: "ICT & Biometrics Unit", desc: "Digital systems, server infrastructure & registry data" },
      { name: "Media & Public Relations", desc: "Press relations & external communications" }
    ]
  },
  {
    id: "core",
    name: "Core Operational Departments",
    role: "Executing the primary statutory mandates of the Commission",
    color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-350 border-emerald-250",
    isCore: true,
    subUnits: [
      {
        name: "Department of Refugee Affairs",
        desc: "Refugee Status Determination (RSD), documentation, asylum intake & protection guidelines.",
        units: ["Status Determination Unit", "Refugee Protection Unit", "Resettlement Pathways"]
      },
      {
        name: "Department of Internally Displaced Persons (IDPs)",
        desc: "Camp management, emergency relief administration, food/NFI logistics & host community support.",
        units: ["Camp Coordination Unit", "Rehabilitation & Relief", "Local Integration Services"]
      },
      {
        name: "Department of Migration Affairs",
        desc: "National Migration Policy coordination, returnee repatriation, reintegration & anti-trafficking partnerships.",
        units: ["Migration Policy Coordination", "Returnee Reintegration", "Counter-Trafficking Advocacy"]
      }
    ]
  },
  {
    id: "support",
    name: "Administrative Support Departments",
    role: "Enabling internal operations, capacity building, and finance",
    color: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-350 border-indigo-250",
    subUnits: [
      {
        name: "Department of Planning, Research & Statistics (PRS)",
        desc: "Information systems, biometric databases, strategic humanitarian planning, M&E.",
        units: ["Data Management & ICT Support", "Research & Policy Development", "Monitoring & Evaluation"]
      },
      {
        name: "Department of Human Resource Management",
        desc: "Personnel recruiting, capacity building, staff welfare, administrative services.",
        units: ["Admin & Personnel Unit", "Training & Welfare Unit", "Registry & Documentation"]
      },
      {
        name: "Department of Finance & Accounts",
        desc: "Budgeting, expenditure accounting, donor fund allocation, financial reporting.",
        units: ["Accounts Unit", "Budget Unit", "Revenue Management"]
      }
    ]
  }
];

export default function About() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "management";
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Who We Are"
        title="Protecting and Empowering Persons of Concern"
        description="Learn about the National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) — our mandate, leadership, and structured departments."
      />

      {/* CORE STATEMENTS SECTION */}
      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* Left: Who We Are Card */}
          <Reveal variant="scale" className="h-full">
            <Card className="h-full border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-elegant flex flex-col justify-between">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-primary">Who We Are</h2>
                  </div>
                  <p className="mt-6 text-base leading-relaxed text-foreground/80">
                    The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) is the Federal Government Agency mandated to provide care, durable solutions and assistance to all Persons of Concern (PoCs) which includes IDPs, Refugees, Migrants, Asylum Seekers, Stateless Persons as well as Returnees.
                  </p>
                </div>
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Est. 1989</span>
                    <span>•</span>
                    <span>Federal Republic of Nigeria</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Right: Vision, Mission & Strategy */}
          <div className="flex flex-col gap-6">
            {/* Vision */}
            <Reveal delay={100} variant="scale">
              <Card className="border-border/70 hover-glow">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400 mt-1">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Vision</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        To be leading world – class humanitarian organization that is operationally vibrant, efficient, and effective in protecting, assisting, and delivering durable and sustainable solutions to all Persons of Concern (PoCs).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>

            {/* Mission */}
            <Reveal delay={200} variant="scale">
              <Card className="border-border/70 hover-glow">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 mt-1">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Mission</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        To integrate international best practices in the moblization of internal and external capacities for effective and efficient delivery of durable solutions to enhance the protection and assistance of PoCs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>

            {/* Strategy */}
            <Reveal delay={300} variant="scale">
              <Card className="border-border/70 hover-glow">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 mt-1">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Strategy</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        To integrate international best practices in the moblization of internal and external capacities for effective and efficient delivery of durable solutions to enhance the protection and assistance of PoCs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* LEADERSHIP & ORGANOGRAM SECTION */}
      <section className="bg-muted/40 py-16 border-t border-b border-border/60">
        <div className="container-page">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b pb-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">Commission Architecture</h2>
                <p className="text-xs text-muted-foreground mt-1">Explore our leadership profiles and departmental operational hierarchy.</p>
              </div>
              <TabsList className="bg-background/80 border p-1 rounded-full">
                <TabsTrigger value="management" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4.5 w-4.5 mr-2" /> Leadership &amp; Management
                </TabsTrigger>
                <TabsTrigger value="departments" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Network className="h-4.5 w-4.5 mr-2" /> Departments &amp; Units
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB CONTENT: MANAGEMENT */}
            <TabsContent value="management" className="animate-in fade-in-50 duration-300">
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
            </TabsContent>

            {/* TAB CONTENT: DEPARTMENTS & ORGANOGRAM */}
            <TabsContent value="departments" className="animate-in fade-in-50 duration-300">
              <div className="space-y-12">
                <div className="bg-background rounded-2xl border border-border p-6 shadow-card max-w-4xl mx-auto">
                  <div className="flex gap-3 items-start border-b pb-4 mb-6">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-bold text-sm">Interactive Administrative Organogram</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This chart displays the administrative flow of NCFRMI under the supervision of the Federal Ministry of Humanitarian Affairs and Poverty Alleviation. Hover or click on the departments to view their specialized sub-units and core mandates.
                      </p>
                    </div>
                  </div>

                  {/* MODERN VISUAL ORGANOGRAM TREE */}
                  <div className="flex flex-col items-center py-4 relative">
                    
                    {/* Level 1: CEO */}
                    <div className="relative z-10 w-full max-w-sm">
                      <div className="border rounded-2xl p-5 bg-primary text-primary-foreground border-primary shadow-elegant text-center hover:scale-105 transition-transform duration-300">
                        <Badge className="bg-white/20 text-white mb-2 text-[9px] font-bold uppercase tracking-widest">
                          Executive Level
                        </Badge>
                        <h4 className="font-display text-base font-extrabold">Office of the Federal Commissioner / CEO</h4>
                        <p className="text-[10px] text-primary-foreground/80 mt-1">Hon. Dr. Aliyu Tijani Ahmed</p>
                      </div>
                    </div>

                    {/* Vertical Connector Line from HFC to Advisory & Core */}
                    <div className="h-10 w-0.5 bg-border my-0" />

                    {/* Level 1.5: Specialized / Advisory Units */}
                    <div className="relative z-10 w-full max-w-2xl border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-border/80 shadow-sm text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block mb-3">
                        Executive Staff &amp; Specialized Units (Advisory Flow)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {departmentsData[1].subUnits?.map((unit) => (
                          <div key={unit.name} className="border border-border/80 rounded-lg p-2 bg-background text-left hover:border-primary/50 transition-colors shadow-inner flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-foreground leading-tight">{unit.name}</span>
                            <span className="text-[8px] text-muted-foreground mt-1 leading-snug">{unit.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vertical Connector Line from Advisory to Line Departments */}
                    <div className="h-10 w-0.5 bg-border my-0" />

                    {/* Level 2: Line Departments Horizontal Split */}
                    <div className="w-full">
                      <span className="text-center text-[10px] font-extrabold uppercase tracking-widest text-primary block mb-6">
                        Line Directorates &amp; Supporting Departments
                      </span>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* Core Operations Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Mandated Core Operations</span>
                          </div>
                          
                          {departmentsData[2].subUnits?.map((dept) => (
                            <Card 
                              key={dept.name} 
                              className={`border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeDept === dept.name ? 'ring-2 ring-emerald-500 bg-emerald-50/10' : ''}`}
                              onClick={() => setActiveDept(activeDept === dept.name ? null : dept.name)}
                            >
                              <CardContent className="p-4">
                                <h5 className="font-display font-bold text-xs text-emerald-900 dark:text-emerald-450">{dept.name}</h5>
                                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{dept.desc}</p>
                                
                                {activeDept === dept.name && dept.units && (
                                  <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 space-y-1.5 animate-in fade-in duration-200">
                                    <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-400">Sub-Units:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {dept.units.map((unit) => (
                                        <Badge key={unit} variant="outline" className="text-[8px] bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-250 text-emerald-900 dark:text-emerald-400">
                                          {unit}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Administrative Support Column */}
                        <div className="space-y-4 lg:col-span-2 grid gap-4 sm:grid-cols-2">
                          <div className="flex items-center gap-2 border-b pb-2 sm:col-span-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Administrative &amp; Enabling Support</span>
                          </div>

                          {departmentsData[3].subUnits?.map((dept) => (
                            <Card 
                              key={dept.name} 
                              className={`border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-500 cursor-pointer transition-all duration-300 hover:shadow-md h-full flex flex-col justify-between ${activeDept === dept.name ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''}`}
                              onClick={() => setActiveDept(activeDept === dept.name ? null : dept.name)}
                            >
                              <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                  <h5 className="font-display font-bold text-xs text-indigo-900 dark:text-indigo-450">{dept.name}</h5>
                                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{dept.desc}</p>
                                </div>
                                
                                {activeDept === dept.name && dept.units && (
                                  <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 space-y-1.5 animate-in fade-in duration-200">
                                    <span className="text-[8px] uppercase tracking-wider font-bold text-indigo-800 dark:text-indigo-450">Sub-Units:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {dept.units.map((unit) => (
                                        <Badge key={unit} variant="outline" className="text-[8px] bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-250 text-indigo-900 dark:text-indigo-400">
                                          {unit}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* HISTORY & MILESTONES */}
      <section className="container-page py-16">
        <Reveal>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Journey</div>
          <h2 className="font-display text-3xl mt-2 font-bold">History &amp; Milestones</h2>
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
      </section>
    </Layout>
  );
}

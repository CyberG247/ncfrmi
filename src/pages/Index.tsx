import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, FileText, AlertTriangle, MapPin, Users, HeartHandshake, Languages, Bot, BarChart3, Fingerprint, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/site/Layout";
import Reveal from "@/components/site/Reveal";
import CountUp from "@/components/site/CountUp";
import heroRefugeeDay from "@/assets/hero-refugeeday-2026.jpg";
import heroRabat1 from "@/assets/hero-rabat1.jpg";
import heroRabat2 from "@/assets/hero-rabat2.jpg";
import heroRabat3 from "@/assets/hero-rabat3.jpg";
import heroTurkiye from "@/assets/hero-turkiye.jpg";
import logo from "@/assets/ncfrmi-logo.png";
import commissioner from "@/assets/commissioner.jpg";

const heroSlides = [
  {
    image: heroRefugeeDay,
    title: "World Refugee Day 2026",
    link: "/news#world-refugee-day-2026"
  },
  {
    image: heroRabat1,
    title: "International Migration Review Forum 2026",
    link: "/news#rabat-process-abuja",
    position: "center 35%"
  },
  {
    image: heroRabat2,
    title: "Rabat Process",
    link: "/news#rabat-process-abuja"
  },
  {
    image: heroRabat3,
    title: "Rabat Process Summit at the Bola Ahmed Tinubu Conference Centre",
    link: "/news#rabat-process-abuja"
  },
  {
    image: heroTurkiye,
    title: "High-Level Delegation from the Republic of Turkiye",
    link: "/news"
  }
];

const services = [
  { icon: ShieldCheck, title: "Protection & Asylum", desc: "Status determination, protection orders, and safe haven for those fleeing persecution." },
  { icon: HeartHandshake, title: "Rehabilitation & Relief", desc: "Food, shelter, healthcare, and psychosocial support for displaced families." },
  { icon: Users, title: "Migration Management", desc: "Orderly, safe and regular migration policy in coordination with partners." },
  { icon: FileText, title: "Legal Aid & Documentation", desc: "Identity documents, certificates, and legal counsel for refugees and IDPs." },
  { icon: MapPin, title: "Durable Solutions", desc: "Voluntary return, local integration, and resettlement pathways." },
  { icon: AlertTriangle, title: "Returnee Reintegration", desc: "Support packages and livelihood programmes for Nigerian returnees." },
];

const stats: { value: number; suffix?: string; prefix?: string; decimals?: number; label: string }[] = [
  { value: 3.4, suffix: "M+", decimals: 1, label: "IDPs supported across Nigeria" },
  { value: 85, suffix: "k+", label: "Refugees & asylum seekers" },
  { value: 37, label: "States & FCT presence" },
  { value: 1989, label: "Established by Decree 52" },
];

const partners = ["UNHCR Nigeria", "IOM", "NEMA", "ICRC", "WFP", "UNICEF"];

export default function Index() {
  const [slide, setSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [simStep, setSimStep] = useState(0);
  const [appComingSoon, setAppComingSoon] = useState(false);

  const playBeep = () => {
    // Audio beep disabled to prevent constant beeping
  };

  useEffect(() => {
    const simInterval = setInterval(() => setSimStep((s) => (s + 1) % 7), 4505);
    return () => {
      clearInterval(simInterval);
    };
  }, []);



  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Layout>
      {(() => {
        const banner = localStorage.getItem("ncfrmi_homepage_banner");
        if (!banner) return null;
        return (
          <div className="text-white font-semibold text-xs py-2.5 px-4 text-center animate-fade-in border-b relative z-50 flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: "#b91c1c", borderColor: "#991b1b" }}>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>{banner}</span>
          </div>
        );
      })()}
      <section className="relative overflow-hidden h-[540px] sm:h-[600px] lg:h-[640px] flex items-end justify-center pb-12 sm:pb-14 lg:pb-16">
        {heroSlides.map((slideObj, i) => (
          <img
            key={i}
            src={slideObj.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === slide ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{ 
              transform: `translate3d(0, ${scrollY * 0.18}px, 0)`,
              objectPosition: (slideObj as any).position || "center"
            }}
            width={1920}
            height={1080}
          />
        ))}
        {/* Slightly darker overlay to improve text readability */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Floating soft particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="particle h-24 w-24 left-[8%] top-[20%] animate-float-slow" />
          <span className="particle h-16 w-16 left-[28%] top-[68%] animate-float" style={{ animationDelay: "1.5s" }} />
          <span className="particle h-32 w-32 right-[12%] top-[30%] animate-float-slow" style={{ animationDelay: "2s" }} />
          <span className="particle h-10 w-10 right-[30%] top-[78%] animate-float" style={{ animationDelay: "0.6s" }} />
        </div>

        <div className="relative z-20 w-full">
          <div className="container-page pt-20 pb-4 text-center">
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
              <div key={slide} className="animate-fade-in flex flex-col items-center space-y-6">
                <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-light tracking-wide text-white leading-snug max-w-3xl drop-shadow-md">
                  {heroSlides[slide].title}
                </h1>
                <div>
                  <Button asChild variant="outline" className="border border-white bg-black/20 hover:bg-white text-white hover:text-slate-900 transition-all duration-300 px-10 py-6 text-base font-normal tracking-wide rounded-sm">
                    <Link to={heroSlides[slide].link}>Read More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sideways Arrows */}
        <button
          onClick={() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/25 hover:bg-black/50 text-white hover:scale-105 active:scale-95 transition-all focus:outline-none border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setSlide((s) => (s + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/25 hover:bg-black/50 text-white hover:scale-105 active:scale-95 transition-all focus:outline-none border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Carousel indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2.5">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide === idx ? "bg-white w-6" : "bg-white/40 w-2 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="text-center lg:text-left">
              <div className="font-display text-3xl font-bold text-primary sm:text-4xl">
                <CountUp
                  end={s.value}
                  prefix={s.prefix ?? ""}
                  suffix={s.suffix ?? ""}
                  decimals={s.decimals ?? 0}
                />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* WELCOME MESSAGE */}
      <section className="bg-gradient-band">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[1fr_2fr] lg:items-center">
          <Reveal variant="scale" className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative img-zoom rounded-2xl">
              <img
                src={commissioner}
                alt="Hon. Dr. Aliyu Tijani Ahmed, Federal Commissioner of NCFRMI"
                className="h-56 w-56 rounded-2xl object-cover shadow-elegant ring-4 ring-primary/15"
                width={224}
                height={224}
              />
              <img
                src={logo}
                alt="NCFRMI seal"
                className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full border-4 border-background bg-background object-contain shadow-card animate-float"
                width={64}
                height={64}
              />
            </div>
            <div className="mt-7 font-display text-lg font-bold">Hon. Dr. Aliyu Tijani Ahmed</div>
            <div className="text-sm text-muted-foreground">Federal Commissioner / CEO</div>
          </Reveal>
          <Reveal delay={120}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Welcome Message</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">A new era of dignity and digital humanitarian services</h2>
            <p className="mt-5 text-base leading-relaxed text-foreground/80">
              Welcome to the official platform of the National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI). Our mission is to provide protection, dignity, and sustainable solutions for displaced persons across Nigeria.
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground/80">
              Through innovation and partnerships, we are transforming humanitarian services for better accessibility and impact — bringing every applicant, camp, and case onto a single, secure digital backbone.
            </p>
            <div className="mt-7 flex flex-wrap gap-4 items-center justify-center lg:justify-start">
              <Button asChild variant="outline" className="hover-lift">
                <Link to="/who-we-are">Read more about NCFRMI <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild className="bg-emerald-700 hover:bg-emerald-800 text-white hover-lift font-bold">
                <Link to="/apply">Apply for Asylum Status <ShieldCheck className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className="container-page py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">What we do</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Services for refugees, migrants, IDPs and returnees</h2>
          <p className="mt-4 text-muted-foreground">Comprehensive, government-coordinated humanitarian programmes — now accessible online.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 90} variant="scale">
              <Card className="group h-full border-border/70 hover-lift hover-glow">
                <CardContent className="p-6">
                  <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FIELD CAPTURE DEMO */}
      <section className="bg-muted/30 border-t border-b border-border py-20">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Field Operations</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Field Officer Capture Station</h2>
            <p className="mt-4 text-muted-foreground">Digital gateway for secure biometric collection, verification, and database synchronisation in real time.</p>
          </Reveal>
          
          <Reveal variant="scale" className="mx-auto max-w-4xl">
            <Card className="p-6 sm:p-8 shadow-card bg-card text-card-foreground border border-border/80">
              <div className="grid gap-8 md:grid-cols-2 items-center">
                {/* Left Side: Onboarding Text & API Credentials */}
                <div className="space-y-6 text-left">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold">Active Workstation</div>
                    <h3 className="font-display text-xl font-bold mt-1 text-foreground">Welcome to the Field Operations Gateway</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed text-xs">
                      The official NCFRMI Field Capture Hub coordinates remote intake and identity registrations. It enables certified officers to process biographical circumstances and capture digital biometrics.
                    </p>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-xs">
                      All collected profiles are cryptographically signed and synced to the secure national cloud database immediately upon verification.
                    </p>
                  </div>

                  {/* API Credentials */}
                  <div className="rounded-xl border bg-muted/40 p-4 space-y-3 shadow-inner text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Terminal API Status</div>
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Gateway
                      </span>
                    </div>
                    
                    <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Gateway URL:</span><span className="font-mono text-foreground">api.ncfrmi.gov.ng/v3</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Environment:</span><span className="text-primary font-medium">PRODUCTION-SECURE</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Active Key:</span><span className="font-mono text-foreground">ncf_live_8a73...3c2f</span></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">SDK Version:</span><span className="font-mono text-foreground">v4.18.2-secure</span></div>
                    </div>
                  </div>

                  <Button asChild size="lg" className="w-full hover-lift">
                    <Link to="/field-capture">Launch Capture Workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>

                {/* Right Side: iPhone 16 Mockup & Download Button */}
                <div className="flex flex-col items-center space-y-4">
                  {/* iPhone 16 Mockup in Light Mode */}
                  <div className="relative h-[480px] w-[240px] rounded-[42px] border-[6px] border-slate-800 bg-slate-900 p-2 shadow-2xl ring-4 ring-slate-700/30">
                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 top-3.5 h-4 w-16 -translate-x-1/2 rounded-full bg-black z-30 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-900/80 ml-auto mr-1.5" />
                    </div>
                    
                    {/* Screen content (LIGHT MODE inside the iPhone) */}
                    <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white text-slate-900 font-sans text-left flex flex-col border border-slate-200">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center px-4 pt-2.5 pb-1 text-[8px] font-bold text-slate-600 bg-slate-100/50 z-20">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-2.5 bg-slate-600 rounded-sm" />
                          <span className="h-2 w-1 bg-slate-600 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* App Screen Interface Mockup */}
                      <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                        {/* Micro Header */}
                        <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5">
                          <img src={logo} alt="Crest" className="h-4 w-4 object-contain" />
                          <span className="text-[9px] font-bold text-slate-800">NCFRMI Mobile</span>
                          <span className="ml-auto text-[7px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium">Zonal Hub</span>
                        </div>

                        {/* Simulation Steps Container */}
                        <div className="flex-1 flex flex-col justify-center py-2 space-y-2 text-xs">
                          {simStep === 0 && (
                            <div className="space-y-1 text-center animate-fade-in flex flex-col items-center w-full">
                              <img src={logo} alt="NCFRMI Crest" className="h-6 w-6 object-contain" />
                              <div className="text-[9px] font-bold text-slate-800 tracking-tight mt-0.5">Welcome back</div>
                              <p className="text-[6px] text-slate-550">Sign in to continue your application.</p>
                              
                              <div className="w-full space-y-1 text-left mt-1.5">
                                <div className="space-y-0.5">
                                  <label className="text-[5px] text-slate-500 font-semibold block">Email</label>
                                  <div className="h-3 bg-slate-50 border border-slate-200 rounded px-1 text-[6px] text-slate-700 flex items-center font-mono">
                                    officer@ncfrmi.gov.ng
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[5px] text-slate-500 font-semibold block">Password</label>
                                  <div className="h-3 bg-slate-50 border border-slate-200 rounded px-1 text-[6px] text-slate-700 flex items-center">
                                    ••••••••••••
                                  </div>
                                </div>
                                <div className="h-3.5 bg-primary text-white text-[6px] font-bold rounded flex items-center justify-center cursor-pointer hover:bg-primary/95 mt-1 shadow-sm font-sans">
                                  Sign in
                                </div>
                                <div className="text-[5px] text-slate-500 text-center mt-0.5">
                                  New to NCFRMI? <span className="text-primary font-bold">Create account</span>
                                </div>
                                
                                <div className="border-t border-slate-200 pt-1 mt-1 space-y-1">
                                  <div className="text-center text-[5px] font-bold uppercase tracking-wider text-slate-400">Simulator Mode (Quick Access)</div>
                                  <div className="grid grid-cols-2 gap-1">
                                    <div className="border border-slate-250 bg-slate-100/50 rounded text-[4.5px] font-semibold text-slate-600 p-0.5 text-center">Comm. Login</div>
                                    <div className="border border-primary/20 bg-primary/5 rounded text-[4.5px] font-bold text-primary p-0.5 text-center">Officer Login</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {simStep === 1 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">1</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 1: Category Selection</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Officer selects the intake category (IDP, Refugee, Migrant, Returnee).</p>
                              <div className="rounded bg-slate-50 border border-slate-200 p-1 text-[8px] font-semibold text-slate-700 text-left">
                                <div className="flex items-center gap-1 p-0.5 bg-slate-200/50 rounded"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Refugee</div>
                                <div className="flex items-center gap-1 p-0.5 opacity-40"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> IDP Camp</div>
                              </div>
                            </div>
                          )}

                          {simStep === 2 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">2</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 2: Collect Biodata</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Record full legal name, phone number, date of birth, and nationality.</p>
                              <div className="space-y-1 text-left">
                                <div className="h-3 bg-white border border-slate-200 rounded px-1 text-[7px] text-slate-750 flex items-center">Musa Musaq</div>
                                <div className="h-3 bg-white border border-slate-200 rounded px-1 text-[7px] text-slate-750 flex items-center">+234 803 123...</div>
                              </div>
                            </div>
                          )}

                          {simStep === 3 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">3</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 3: Circumstances</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Describe displacement circumstances and detail the family dependants.</p>
                              <div className="bg-slate-100 p-1 rounded text-[7px] text-slate-600 text-left border border-slate-200">
                                Fled region due to climate floods, seeks rehabilitation shelter...
                              </div>
                            </div>
                          )}

                          {simStep === 4 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">4</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 4: Facial Biometrics</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Simulate digital facial capturing with real-time feedback detection.</p>
                              <div className="relative mx-auto h-14 w-14 rounded-md bg-slate-200 border border-slate-350 overflow-hidden flex items-center justify-center">
                                <div className="absolute h-8 w-8 border border-emerald-500 border-dashed rounded-full" />
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                                <span className="text-[5px] text-emerald-600 font-bold bg-white/80 px-1 rounded absolute bottom-0.5">Detecting...</span>
                              </div>
                            </div>
                          )}

                          {simStep === 5 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">5</div>
                              <div className="text-[9px] font-bold text-slate-800">Step 5: Thumbprint Scan</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Scan left/right thumbprints for secure biometric index registration.</p>
                              <div className="relative mx-auto h-14 w-10 rounded-md bg-slate-900 border border-slate-400 overflow-hidden flex items-center justify-center">
                                <Fingerprint className="h-6 w-6 text-emerald-450" />
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 animate-scanline" />
                              </div>
                            </div>
                          )}

                          {simStep === 6 && (
                            <div className="space-y-1.5 text-center animate-fade-in">
                              <div className="mx-auto h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">✓</div>
                              <div className="text-[9px] font-bold text-emerald-600">Step 6: Sync Completed</div>
                              <p className="text-[8px] text-slate-500 leading-snug">Record successfully compiled and uploaded to the NCFRMI security registry.</p>
                              <div className="text-[7px] font-mono text-slate-400 bg-white border border-slate-200 p-0.5 rounded text-center">
                                NCF-REG-2026-A9F3
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Looping Progress Dots */}
                        <div className="flex justify-center gap-1 border-t border-slate-200 pt-2 pb-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                              key={idx}
                              className={`h-1 w-1 rounded-full transition-all duration-300 ${
                                simStep === idx ? "bg-primary w-2.5" : "bg-slate-305"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button variant="outline" size="sm" onClick={() => { setAppComingSoon(true); toast.info("Coming soon!"); }} className="hover-lift">
                    <Download className="mr-2 h-3.5 w-3.5" /> {appComingSoon ? "Coming Soon!" : "Download & Install the App"}
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* APPLY CTA */}
      <section className="hero-animated text-primary-foreground">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl">Start a secure online application</h2>
            <p className="mt-4 max-w-xl text-primary-foreground/85">
              Create an account, save your progress, upload documents, and track your case status in real time — for asylum, refugee status, IDP registration, or returnee support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover-lift">
                <Link to="/register">Create account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground hover-lift">
                <Link to="/apply">Browse application types</Link>
              </Button>
            </div>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              ["Asylum Application", "Status determination & protection"],
              ["Refugee Status", "Recognition under Nigerian law"],
              ["IDP Registration", "Camp & host community support"],
              ["Returnee Support", "Reintegration & livelihoods"],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 100} variant="scale">
                <li className="rounded-xl border border-primary-foreground/20 bg-primary-deep/40 p-5 backdrop-blur hover-lift">
                  <div className="font-display font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-primary-foreground/80">{d}</div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <section className="container-page py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Languages, t: "Multilingual", d: "English, Hausa, Yoruba, Igbo" },
            { icon: Bot, t: "AI Guidance", d: "24/7 chatbot for applicants" },
            { icon: ShieldCheck, t: "Secure & Encrypted", d: "End-to-end HTTPS, 2FA" },
            { icon: BarChart3, t: "Real-time Data", d: "Dashboards for policymakers" },
          ].map(({ icon: Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 80}>
              <div className="group rounded-xl border border-border bg-card p-6 shadow-card hover-lift hover-glow">
                <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                <div className="mt-4 font-display font-semibold">{t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-y border-border bg-muted/40">
        <div className="container-page py-12 text-center">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Partners</div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl">Working alongside global humanitarian leaders</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {partners.map((p, i) => (
              <Reveal key={p} delay={i * 70} variant="scale">
                <div className="rounded-lg border border-border bg-background px-4 py-5 text-sm font-semibold text-foreground/70 hover-lift">
                  {p}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EMERGENCY */}
      <section className="container-page py-20">
        <Reveal variant="scale">
          <div className="overflow-hidden rounded-2xl bg-accent text-accent-foreground shadow-elegant hover-lift">
            <div className="grid gap-6 p-8 sm:p-12 lg:grid-cols-[2fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-accent-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <AlertTriangle className="h-3.5 w-3.5 animate-pulse-soft" /> Emergency
                </div>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl">Need urgent help or want to report displacement?</h2>
                <p className="mt-3 max-w-xl text-accent-foreground/90">
                  Use our secure incident reporting form for displacement, missing persons, or urgent humanitarian needs. Our zonal teams respond around the clock.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 hover-lift">
                  <Link to="/report">Report incident</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-accent-foreground/40 bg-transparent text-accent-foreground hover:bg-accent-foreground/10 hover:text-accent-foreground hover-lift">
                  <a href="tel:+2349461000">Call helpline</a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}

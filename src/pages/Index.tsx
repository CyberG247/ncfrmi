import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, FileText, AlertTriangle, MapPin, Users, HeartHandshake, Languages, Bot, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/site/Layout";
import Reveal from "@/components/site/Reveal";
import CountUp from "@/components/site/CountUp";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import logo from "@/assets/ncfrmi-logo.png";
import commissioner from "@/assets/commissioner.jpg";

const heroSlides = [hero1, hero2, hero3];

const services = [
  { icon: ShieldCheck, title: "Protection & Asylum", desc: "Status determination, protection orders, and safe haven for those fleeing persecution." },
  { icon: HeartHandshake, title: "Rehabilitation & Relief", desc: "Food, shelter, healthcare, and psychosocial support for displaced families." },
  { icon: Users, title: "Migration Management", desc: "Orderly, safe and regular migration policy in coordination with partners." },
  { icon: FileText, title: "Legal Aid & Documentation", desc: "Identity documents, certificates, and legal counsel for refugees and IDPs." },
  { icon: MapPin, title: "Durable Solutions", desc: "Voluntary return, local integration, and resettlement pathways." },
  { icon: AlertTriangle, title: "Returnee Reintegration", desc: "Support packages and livelihood programmes for Nigerian returnees." },
];

const stats: { value: number; suffix?: string; prefix?: string; label: string }[] = [
  { value: 3.4, suffix: "M+", decimals: 1 as never, label: "IDPs supported across Nigeria" } as never,
  { value: 85, suffix: "k+", label: "Refugees & asylum seekers" },
  { value: 37, label: "States & FCT presence" },
  { value: 1989, label: "Established by Decree 52" },
];

const partners = ["UNHCR Nigeria", "IOM", "NEMA", "ICRC", "WFP", "UNICEF"];

export default function Index() {
  const [slide, setSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {heroSlides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${
              i === slide ? "opacity-100 animate-ken-burns" : "opacity-0"
            }`}
            style={{ transform: `translate3d(0, ${scrollY * 0.18}px, 0)` }}
            width={1920}
            height={1080}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-overlay" />

        {/* Floating soft particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="particle h-24 w-24 left-[8%] top-[20%] animate-float-slow" />
          <span className="particle h-16 w-16 left-[28%] top-[68%] animate-float" style={{ animationDelay: "1.5s" }} />
          <span className="particle h-32 w-32 right-[12%] top-[30%] animate-float-slow" style={{ animationDelay: "2s" }} />
          <span className="particle h-10 w-10 right-[30%] top-[78%] animate-float" style={{ animationDelay: "0.6s" }} />
        </div>

        <div className="relative">
          <div className="container-page py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl text-primary-foreground">
              <Reveal variant="blur" className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className="inline-block h-2 w-2 rounded-full bg-primary-glow animate-pulse-soft" />
                Federal Government of Nigeria
              </Reveal>
              <Reveal as="h1" delay={120} className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Protecting, Assisting, and Empowering Displaced Persons in Nigeria
              </Reveal>
              <Reveal as="p" delay={240} className="mt-5 max-w-xl text-base text-primary-foreground/90 sm:text-lg">
                The official platform of the National Commission for Refugees, Migrants and Internally Displaced Persons. Apply, register, and access humanitarian services online.
              </Reveal>
              <Reveal delay={360} className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover-lift">
                  <Link to="/apply?type=asylum">Apply for Asylum <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground hover-lift">
                  <Link to="/apply?type=idp">Register as IDP</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-accent/90 text-accent-foreground hover:bg-accent hover-lift">
                  <Link to="/report">Report Displacement</Link>
                </Button>
              </Reveal>
            </div>
          </div>
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
                  decimals={(s as { decimals?: number }).decimals ?? 0}
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
                alt="Hon. Aliyu Tijani Ahmed, Federal Commissioner of NCFRMI"
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
            <div className="mt-7 font-display text-lg font-bold">Hon. Aliyu Tijani Ahmed</div>
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
            <div className="mt-7">
              <Button asChild variant="outline" className="hover-lift">
                <Link to="/about">Read more about NCFRMI <ArrowRight className="ml-1 h-4 w-4" /></Link>
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

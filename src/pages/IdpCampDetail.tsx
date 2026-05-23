import { Link, useParams } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCampBySlug } from "@/data/idpCamps";
import { ArrowLeft, MapPin, Users, Phone, Mail, Calendar, Building2, HeartHandshake, ShieldCheck } from "lucide-react";

export default function IdpCampDetail() {
  const { slug } = useParams<{ slug: string }>();
  const camp = slug ? getCampBySlug(slug) : undefined;

  if (!camp) {
    return (
      <Layout>
        <PageHero eyebrow="IDP Camp" title="Camp not found" description="The requested camp could not be found." />
        <section className="container-page py-12">
          <Button asChild variant="outline"><Link to="/idp-camps"><ArrowLeft className="mr-2 h-4 w-4" />Back to directory</Link></Button>
        </section>
      </Layout>
    );
  }

  const pct = Math.round((camp.population / camp.capacity) * 100);
  const demo = camp.demographics;
  const total = demo.children + demo.women + demo.men + demo.elderly;

  return (
    <Layout>
      <PageHero
        eyebrow={`${camp.region} · ${camp.state} State`}
        title={camp.name}
        description={`${camp.lga} LGA · Established ${camp.established} · Managed by ${camp.manager}`}
      />

      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/idp-camps"><ArrowLeft className="mr-2 h-4 w-4" />Back to directory</Link>
          </Button>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {camp.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-semibold">Camp overview</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{camp.overview}</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {camp.population.toLocaleString()} of {camp.capacity.toLocaleString()} capacity</span>
                    <span>{pct}% occupancy · {camp.households.toLocaleString()} households</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-[1200ms]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Contact & location</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> {camp.lga}, {camp.state} ({camp.coordinates.lat.toFixed(4)}, {camp.coordinates.lng.toFixed(4)})</li>
                  <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-primary" /> {camp.contact.phone}</li>
                  <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-primary" /> {camp.contact.email}</li>
                  <li className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 text-primary" /> Established {camp.established}</li>
                  <li className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 text-primary" /> {camp.manager}</li>
                </ul>
                <Button asChild className="mt-4 w-full" size="sm">
                  <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${camp.coordinates.lat},${camp.coordinates.lng}`}>
                    Open in Maps
                  </a>
                </Button>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={120}>
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Demographics</h3>
                <p className="mt-1 text-xs text-muted-foreground">Total registered: {total.toLocaleString()}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {([
                    ["Children", demo.children],
                    ["Women", demo.women],
                    ["Men", demo.men],
                    ["Elderly", demo.elderly],
                  ] as const).map(([label, n]) => {
                    const p = Math.round((n / total) * 100);
                    return (
                      <li key={label}>
                        <div className="flex items-center justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{n.toLocaleString()} · {p}%</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${p}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={160}>
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-primary" /> Services provided</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {camp.services.map((s) => (
                    <span key={s} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/80">{s}</span>
                  ))}
                </div>
                <h4 className="mt-5 text-sm font-semibold">Facilities on-site</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {camp.facilities.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={200}>
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Partners</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {camp.partners.map((p) => (
                    <span key={p} className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">{p}</span>
                  ))}
                </div>
                <h4 className="mt-5 text-sm font-semibold">Priority needs</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {camp.needs.map((n) => <li key={n}>{n}</li>)}
                </ul>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div className="mt-10 rounded-lg border bg-card p-6 text-center">
          <h3 className="font-display text-lg font-semibold">Need assistance or want to support this camp?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Reach out to the National Commission for Refugees, Migrants and IDPs.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/contact">Contact NCFRMI</Link></Button>
            <Button asChild variant="outline"><Link to="/report">Report Displacement</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, ArrowRight } from "lucide-react";
import { idpCamps } from "@/data/idpCamps";

const regions = ["All", "North-East", "North-West", "North-Central", "South-East", "South-West", "South-South"];

export default function IdpCamps() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");

  const filtered = idpCamps.filter(
    (c) =>
      (region === "All" || c.region === region) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.state.toLowerCase().includes(q.toLowerCase()) ||
        c.lga.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <PageHero
        eyebrow="IDP Camps Directory"
        title="Find IDP camps and services across Nigeria"
        description="Search a directory of registered IDP camps, view capacity and available services. Click any camp to view full details."
      />
      <section className="container-page py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input placeholder="Search by name, state, or LGA…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-md" />
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-base ${
                  region === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground/70 hover:border-primary/40"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const pct = Math.round((c.population / c.capacity) * 100);
            return (
              <Reveal key={c.slug} delay={(i % 6) * 80} variant="scale">
                <Link to={`/idp-camps/${c.slug}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                  <Card className="group h-full hover-lift hover-glow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-primary">{c.name}</h3>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {c.lga}, {c.state} · {c.region}
                          </div>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{c.status}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.population.toLocaleString()} / {c.capacity.toLocaleString()}</span>
                          <span>{pct}% capacity</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-[1200ms] ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {c.services.slice(0, 4).map((s) => (
                          <span key={s} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/70 transition-colors group-hover:bg-primary/10 group-hover:text-primary">{s}</span>
                        ))}
                        {c.services.length > 4 && (
                          <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/60">+{c.services.length - 4}</span>
                        )}
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        View camp details <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="mt-10 text-center text-muted-foreground">No camps match your filters.</p>}
      </section>
    </Layout>
  );
}

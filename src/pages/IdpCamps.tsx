import { useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

const camps = [
  { name: "Bakassi IDP Camp", state: "Borno", region: "North-East", lga: "Maiduguri", capacity: 12000, population: 9800, services: ["Health", "Food", "Shelter", "Education"] },
  { name: "Dalori Camp I", state: "Borno", region: "North-East", lga: "Konduga", capacity: 18000, population: 16500, services: ["Health", "WASH", "Food"] },
  { name: "Durumi IDP Settlement", state: "FCT", region: "North-Central", lga: "AMAC", capacity: 4500, population: 3900, services: ["Health", "Education"] },
  { name: "Wassa Camp", state: "FCT", region: "North-Central", lga: "AMAC", capacity: 3000, population: 2700, services: ["Food", "Shelter"] },
  { name: "Malkohi Camp", state: "Adamawa", region: "North-East", lga: "Yola South", capacity: 6500, population: 5200, services: ["Health", "Food", "WASH"] },
  { name: "Geidam Transit Site", state: "Yobe", region: "North-East", lga: "Geidam", capacity: 2200, population: 1700, services: ["Shelter", "NFI"] },
  { name: "Anguwan Rimi Camp", state: "Kaduna", region: "North-West", lga: "Kaduna North", capacity: 1800, population: 1250, services: ["Food", "Health"] },
  { name: "Tegina Settlement", state: "Niger", region: "North-Central", lga: "Rafi", capacity: 2400, population: 2100, services: ["Shelter", "Food"] },
];

const regions = ["All", "North-East", "North-West", "North-Central", "South-East", "South-West", "South-South"];

export default function IdpCamps() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");

  const filtered = camps.filter(
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
        description="Search a directory of registered IDP camps, view capacity and available services."
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
          {filtered.map((c) => {
            const pct = Math.round((c.population / c.capacity) * 100);
            return (
              <Card key={c.name}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {c.lga}, {c.state} · {c.region}
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Active</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.population.toLocaleString()} / {c.capacity.toLocaleString()}</span>
                      <span>{pct}% capacity</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.services.map((s) => (
                      <span key={s} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/70">{s}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="mt-10 text-center text-muted-foreground">No camps match your filters.</p>}
      </section>
    </Layout>
  );
}

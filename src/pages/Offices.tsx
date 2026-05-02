import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock } from "lucide-react";

const offices = [
  { type: "Headquarters", name: "Abuja HQ", address: "Plot 2280, Mohammadu Buhari Way, CBD, Abuja", phone: "+234 9 461 0000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "North-East Zonal Office", address: "Maiduguri, Borno State", phone: "+234 76 000 000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "North-West Zonal Office", address: "Kaduna, Kaduna State", phone: "+234 62 000 000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "North-Central Zonal Office", address: "Jos, Plateau State", phone: "+234 73 000 000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "South-East Zonal Office", address: "Enugu, Enugu State", phone: "+234 42 000 000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "South-West Zonal Office", address: "Lagos, Lagos State", phone: "+234 1 000 0000", hours: "Mon–Fri · 8am–5pm" },
  { type: "Zonal", name: "South-South Zonal Office", address: "Port Harcourt, Rivers State", phone: "+234 84 000 000", hours: "Mon–Fri · 8am–5pm" },
];

export default function Offices() {
  return (
    <Layout>
      <PageHero
        eyebrow="Zonal & State Offices"
        title="Find an NCFRMI office near you"
        description="Visit any of our zonal or state offices for in-person assistance, biometric capture, and case follow-up."
      />
      <section className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((o) => (
            <Card key={o.name}>
              <CardContent className="p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{o.type}</div>
                <h3 className="mt-1 font-display text-lg font-semibold">{o.name}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {o.address}</li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {o.phone}</li>
                  <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> {o.hours}</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}

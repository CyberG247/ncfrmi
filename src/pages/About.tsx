import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/ncfrmi-logo.png";

export default function About() {
  return (
    <Layout>
      <PageHero
        eyebrow="About NCFRMI"
        title="A federal mandate to protect the displaced"
        description="Established in 1989 by Decree 52, NCFRMI coordinates Nigeria's response to refugees, migrants, returnees, and internally displaced persons."
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <Card><CardContent className="p-7">
          <h3 className="font-display text-lg font-bold">Our Mandate</h3>
          <p className="mt-3 text-sm text-muted-foreground">Provide protection, assistance, and durable solutions for refugees, asylum seekers, IDPs, returnees and migrants in line with national and international law.</p>
        </CardContent></Card>
        <Card><CardContent className="p-7">
          <h3 className="font-display text-lg font-bold">Our Vision</h3>
          <p className="mt-3 text-sm text-muted-foreground">A Nigeria where every displaced person enjoys dignity, safety and opportunity for sustainable reintegration.</p>
        </CardContent></Card>
        <Card><CardContent className="p-7">
          <h3 className="font-display text-lg font-bold">Our Values</h3>
          <p className="mt-3 text-sm text-muted-foreground">Compassion, accountability, partnership, integrity and innovation in humanitarian service.</p>
        </CardContent></Card>
      </section>

      <section className="bg-muted/40">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center">
            <img src={logo} alt="NCFRMI" className="h-40 w-40" width={160} height={160} />
          </div>
          <div>
            <h2 className="font-display text-3xl">Leadership</h2>
            <p className="mt-4 text-muted-foreground">Hon. Aliyu Tijani Ahmed serves as Federal Commissioner and CEO, leading the Commission's reform and digital transformation agenda. Our leadership team brings together humanitarian experts, civil servants and policy specialists committed to displaced populations.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-3xl">History &amp; Functions</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            ["1989", "NCFRMI established by Decree 52 to manage refugee affairs in Nigeria."],
            ["2002", "Mandate expanded to cover migration management."],
            ["2009", "Internally Displaced Persons added to the Commission's portfolio."],
            ["Today", "A unified federal agency for refugees, migrants, IDPs and returnees."],
          ].map(([y, t]) => (
            <div key={y} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="font-display text-2xl font-bold text-primary">{y}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

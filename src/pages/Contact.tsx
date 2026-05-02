import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Contact() {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent", description: "We'll respond within 2 business days." });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <Layout>
      <PageHero eyebrow="Contact" title="Get in touch with NCFRMI" description="Reach our headquarters or any of our zonal offices." />
      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            {[
              { Icon: MapPin, t: "Headquarters", d: "Plot 2280, Mohammadu Buhari Way, CBD, Abuja" },
              { Icon: Phone, t: "Phone", d: "+234 (0)9 461 0000" },
              { Icon: Mail, t: "Email", d: "info@ncfrmi.gov.ng" },
              { Icon: Clock, t: "Hours", d: "Monday – Friday · 8:00am – 5:00pm" },
            ].map(({ Icon, t, d }) => (
              <Card key={t}><CardContent className="flex gap-4 p-5">
                <div className="rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                <div>
                  <div className="font-display font-semibold">{t}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </CardContent></Card>
            ))}
          </div>

          <Card><CardContent className="p-7">
            <form onSubmit={onSubmit} className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-sm font-medium">Full name</label><Input required className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">Email</label><Input required type="email" className="mt-1.5" /></div>
              </div>
              <div><label className="text-sm font-medium">Subject</label><Input required className="mt-1.5" /></div>
              <div><label className="text-sm font-medium">Message</label><Textarea required rows={6} className="mt-1.5" /></div>
              <Button size="lg" type="submit">Send message</Button>
            </form>
          </CardContent></Card>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-card">
          <iframe
            title="NCFRMI Headquarters Map"
            src="https://www.google.com/maps?q=Central+Business+District,+Abuja,+Nigeria&output=embed"
            className="h-80 w-full"
            loading="lazy"
          />
        </div>
      </section>
    </Layout>
  );
}

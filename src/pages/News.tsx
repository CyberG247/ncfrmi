import { useEffect, useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const hardcodedNews = [
  { date: "Apr 28, 2026", tag: "Press Release", title: "NCFRMI launches digital portal for asylum applications", excerpt: "The Commission unveils a secure online platform allowing applicants nationwide to apply remotely, upload documents and track cases in real time." },
  { date: "Apr 14, 2026", tag: "Field Update", title: "Relief distribution reaches 12,000 households in Borno", excerpt: "Joint field operation with NEMA and partners delivers food, NFI kits and shelter materials to displaced families." },
  { date: "Mar 30, 2026", tag: "Announcement", title: "Voluntary repatriation programme expands to Cameroon corridor", excerpt: "New phase of voluntary returns begins for Nigerian refugees in neighbouring states." },
  { date: "Mar 12, 2026", tag: "Partnership", title: "MoU signed with UNHCR on biometric registration", excerpt: "Strengthening identity systems for refugees and asylum seekers across Nigeria." },
];

type NewsItem = { id?: string; date: string; tag: string; title: string; excerpt: string; created_at?: string };

export default function News() {
  const [news, setNews] = useState<NewsItem[]>(hardcodedNews);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          setNews(data);
        }
      } catch (err) {
        console.error("Failed to load dynamic news:", err);
      }
    };
    fetchNews();

    // Subscribe to realtime updates
    const ch = supabase.channel("news-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, () => {
        fetchNews();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <Layout>
      <PageHero eyebrow="News & Updates" title="Latest from NCFRMI" description="Press releases, field activities and government announcements." />
      <section className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          {news.map((n) => (
            <Card key={n.id || n.title} className="transition-base hover:-translate-y-1 hover:shadow-card">
              <CardContent className="p-7">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">{n.tag}</span>
                  <span className="text-muted-foreground">{n.date}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{n.excerpt}</p>
                <a href="#" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Read more →</a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}

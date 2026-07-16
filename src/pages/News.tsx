import { useEffect, useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Globe, Award, Landmark, Users, X, ZoomIn } from "lucide-react";
import Reveal from "@/components/site/Reveal";

import heroRabat1 from "@/assets/hero-rabat1.jpg";
import heroRabat2 from "@/assets/hero-rabat2.jpg";
import heroRabat3 from "@/assets/hero-rabat3.jpg";
import heroRabat4 from "@/assets/hero-rabat4.jpg";
import heroRabat5 from "@/assets/hero-rabat5.jpg";
import heroEvent1 from "@/assets/hero-event1.jpg";
import heroEvent2 from "@/assets/hero-event2.jpg";

const galleryImages = [
  {
    src: heroRabat1,
    title: "United Nations Dialogue",
    description: "Nigeria delegation seated at the high-level United Nations Rabat Process summit in Abuja."
  },
  {
    src: heroRabat2,
    title: "Presidential Opening Address",
    description: "High-level delegation stand representing regional alliances at the summit."
  },
  {
    src: heroRabat3,
    title: "Euro-African Summit Panel",
    description: "Delegations debating safe and regular migration governance and policy frameworks."
  },
  {
    src: heroRabat4,
    title: "Presentation of Humanitarian Award",
    description: "Hon. Federal Commissioner presenting bilateral cooperation symbols representing durable solutions."
  },
  {
    src: heroRabat5,
    title: "Consultations on Reintegration",
    description: "Delegates discussing joint initiatives for orderly and humane returnee programs."
  },
  {
    src: heroEvent1,
    title: "Durable Solutions Committee",
    description: "Validation session for the National Strategy on Durable Solutions for refugees and IDPs."
  },
  {
    src: heroEvent2,
    title: "World Refugee Day 2026",
    description: "Commemoration event restoring hope and protecting the dignity of displaced populations."
  }
];

const hardcodedNews = [
  {
    id: "rabat-process-abuja",
    date: "July 16, 2026",
    tag: "Summit",
    title: "Rabat Process: Nigeria Hosts High-Level Euro-African Dialogue on Migration and Development in Abuja",
    excerpt: "The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) hosted the high-level Rabat Process dialogue at the Bola Ahmed Tinubu International Conference Centre, Abuja. Delegations from European and African member states convened to discuss migration governance, protection of refugees, and regional development solutions.",
    category: "Domestic",
    icon: Landmark
  },
  {
    id: "bilateral-cooperation-migration",
    date: "July 16, 2026",
    tag: "Conference",
    title: "Fostering International Partnerships: NCFRMI Strengthens Bilateral Cooperation on Migration Reintegration",
    excerpt: "During the Euro-African Dialogue, Federal Commissioner Hon. Dr. Aliyu Tijani Ahmed presented diplomatic symbols representing Nigeria's durable solutions strategy, reaffirming bilateral commitments to voluntary returns, dignity restoration, and shared responsibility on migration management.",
    category: "International",
    icon: Globe
  },
  {
    id: "durable-solutions-nigeria",
    date: "July 16, 2026",
    tag: "Summit",
    title: "A Landmark Day for Durable Solutions in Nigeria: NCFRMI Validates National Strategy and Inaugurates Technical Working Group",
    excerpt: "The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI), in collaboration with international partners, has successfully validated the National Strategy on Durable Solutions. During the high-level meeting, the Commission also inaugurated the Technical Working Group dedicated to coordinating and implementing sustainable integration, relocation, and empowerment policies for displaced persons and refugees across the federation.\n\nFederal Commissioner Hon. Dr. Aliyu Tijani Ahmed highlighted that this strategy marks a significant milestone in Nigeria's commitment to transitioning from short-term humanitarian relief to long-term sustainable development and self-reliance for all Persons of Concern.",
    category: "Domestic",
    icon: Landmark
  },
  {
    id: "world-refugee-day-2026",
    date: "June 20, 2026",
    tag: "Summit",
    title: "Restoring Hope, Protecting Dignity: NCFRMI Marks World Refugee Day 2026",
    excerpt: "The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) yesterday joined the global community to commemorate World Refugee Day 2026 — a moment to recognise the courage of displaced persons and reaffirm our shared commitment to humanity.\n\nThe event, led by the Secretary to the Government of the Federation (SGF) and the Honourable Minister of Humanitarian Affairs and Poverty Reduction, Dr. Bernard Doro, brought together government officials, diplomatic missions, humanitarian partners, and stakeholders united by a common goal: restoring hope to those affected by displacement.\n\nIn his address, the Honourable Federal Commissioner of NCFRMI reaffirmed Nigeria’s commitment to protecting refugees and asylum seekers, providing support, and creating opportunities that enable displaced communities to rebuild their lives with dignity.\n\nThrough collaboration with partners, NCFRMI continues to champion humanitarian solutions — from protection and resettlement to education, healthcare, livelihood support, and voluntary returns.\n\nOn World Refugee Day, we remember that behind every displacement story is a human being deserving of compassion, safety, and hope.\n\nTogether, we stand with refugees. Together, we restore hope.",
    category: "Domestic",
    icon: Landmark
  },
  {
    id: "news-1",
    date: "July 12, 2026",
    tag: "Conference",
    title: "Survivor-Centred Reintegration Policy Dialogue Held in Ibadan",
    excerpt: "NCFRMI joined stakeholders at the International Institute of Tropical Agriculture (IITA), Ibadan, for the 'Stronger Futures' cross-border policy dialogue. The event focused on sustainable reintegration programs and vocational empowerment for returnees.",
    category: "International",
    icon: Globe
  },
  {
    id: "news-2",
    date: "June 20, 2026",
    tag: "Declaration",
    title: "World Refugee Day 2026: Dialogue on 1951 Convention at 75",
    excerpt: "At a high-level dialogue in Abuja, Federal Commissioner Hon. Dr. Aliyu Tijani Ahmed reaffirmed Nigeria's commitment to keeping borders open for asylum seekers and protecting human rights under international law, celebrating 75 years of refugee protection.",
    category: "Domestic",
    icon: Landmark
  },
  {
    id: "news-3",
    date: "May 08, 2026",
    tag: "Summit",
    title: "ECOWAS Regional Conference on Refugee status & Rights Harmonization",
    excerpt: "Representatives from 15 member states converged at the ECOWAS headquarters to review regional refugee status determination (RSD) protocols and draft standardized policies to support stateless persons.",
    category: "International",
    icon: Globe
  },
  {
    id: "news-4",
    date: "April 28, 2026",
    tag: "Press Release",
    title: "Commission Launches Secure Digital Portal for Registrants & Asylum Seekers",
    excerpt: "The NCFRMI officially launched its secure online application portal, bringing identity management, case tracking, and field officer biometrics capture into a single, unified database.",
    category: "Domestic",
    icon: Award
  },
  {
    id: "news-5",
    date: "February 12, 2026",
    tag: "Conference",
    title: "Lagos Private Sector Conference Fosters Economic Resilience for IDPs",
    excerpt: "NCFRMI, in partnership with Vice President Kashim Shettima, held a multi-stakeholder private sector engagement in Lagos. The conference designed market-based solutions, vocations, and funding grants to assist IDP camps.",
    category: "Domestic",
    icon: Users
  }
];

type NewsItem = { id?: string; date: string; tag: string; title: string; excerpt: string; category?: string; created_at?: string };

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [highlightedId, setHighlightedId] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; title: string; description: string } | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        setHighlightedId(window.location.hash.substring(1));
      } else {
        setHighlightedId("");
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (news.length > 0 && window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
      }
    }
  }, [news]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          // Merge dynamic news with our detailed conference news
          const dynamicNews = data.map((item, idx) => ({
            id: item.id || `dyn-${idx}`,
            date: new Date(item.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || "Recent",
            tag: item.tag || "Announcement",
            title: item.title,
            excerpt: item.excerpt,
            category: "Domestic"
          }));
          setNews([...dynamicNews, ...hardcodedNews]);
        } else {
          setNews(hardcodedNews);
        }
      } catch (err) {
        console.error("Failed to load dynamic news:", err);
        setNews(hardcodedNews);
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
      <PageHero 
        eyebrow="Media &amp; Updates" 
        title="News, Conferences &amp; Press Releases" 
        description="Stay updated with the domestic and international activities, summits, and policy dialogues hosted or attended by the Commission." 
      />
      
      <section className="container-page py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Recent Updates</h2>
            <p className="text-xs text-muted-foreground mt-1">Reflecting global conferences, local relief reports, and operational news.</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold px-3 py-1 text-[10px] uppercase">
              All Media
            </Badge>
            <Badge variant="outline" className="border-border text-foreground hover:bg-muted font-semibold px-3 py-1 text-[10px] uppercase">
              Conferences
            </Badge>
            <Badge variant="outline" className="border-border text-foreground hover:bg-muted font-semibold px-3 py-1 text-[10px] uppercase">
              Press Releases
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {news.map((n, idx) => (
            <Reveal key={n.id || n.title} delay={idx * 50} variant="scale">
              <Card 
                id={n.id} 
                className={`h-full border-border/80 hover-lift hover-glow flex flex-col justify-between transition-all duration-500 ${
                  highlightedId === n.id ? "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg shadow-primary/20 bg-primary/5 border-primary/50" : ""
                }`}
              >
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-transparent font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                          {n.tag}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-[9px] font-semibold border-border text-foreground tracking-wider px-2 py-0.5">
                          {n.category || "Domestic"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{n.date}</span>
                      </div>
                    </div>

                    <h3 className="font-display font-extrabold text-base text-foreground leading-snug hover:text-primary transition-colors cursor-pointer">
                      {n.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {n.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 border-t pt-4 flex items-center justify-between">
                    <a href="#" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Read full briefing <span className="text-[10px]">→</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PHOTO GALLERY SECTION */}
      <section className="bg-muted/30 border-t border-b border-border py-16">
        <div className="container-page">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Media Gallery</div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold">Summits &amp; Humanitarian Events</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-10">High-resolution briefings from international dialogues and field interventions.</p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryImages.map((img, idx) => (
              <Reveal key={idx} delay={idx * 50} variant="scale">
                <div 
                  onClick={() => setLightbox(img)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-card hover-lift transition-all duration-300"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img 
                      src={img.src} 
                      alt={img.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <ZoomIn className="h-5 w-5 text-white absolute top-3 right-3 animate-pulse" />
                    <h4 className="text-sm font-bold text-white leading-tight">{img.title}</h4>
                    <p className="text-[10px] text-slate-350 line-clamp-2 mt-1">{img.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-10 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button 
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className="relative max-w-4xl w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/10] w-full overflow-hidden animate-pulse-soft">
              <img 
                src={lightbox.src} 
                alt={lightbox.title} 
                className="h-full w-full object-contain" 
              />
            </div>
            <div className="bg-zinc-905 p-6 border-t border-zinc-800 space-y-1">
              <h3 className="font-display text-lg font-bold text-white">{lightbox.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{lightbox.description}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

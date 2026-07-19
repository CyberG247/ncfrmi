import { useState, useEffect } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

// Image imports
import heroRabat1 from "@/assets/hero-rabat1.jpg";
import heroRabat2 from "@/assets/hero-rabat2.jpg";
import heroRabat3 from "@/assets/hero-rabat3.jpg";
import heroRabat4 from "@/assets/hero-rabat4.jpg";
import heroRabat5 from "@/assets/hero-rabat5.jpg";
import galleryRabat6 from "@/assets/gallery-rabat6.png";

import heroEvent2 from "@/assets/hero-event2.jpg";
import heroHumanitarian from "@/assets/hero-humanitarian.jpg";
import galleryRefugee1 from "@/assets/gallery-refugee1.png";
import galleryRefugee2 from "@/assets/gallery-refugee2.png";
import galleryRefugee3 from "@/assets/gallery-refugee3.png";
import galleryRefugee4 from "@/assets/gallery-refugee4.png";

import heroEvent1 from "@/assets/hero-event1.jpg";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import gallerySolutions5 from "@/assets/gallery-solutions5.png";
import gallerySolutions6 from "@/assets/gallery-solutions6.jpg";

const gallerySegments = [
  {
    id: "rabat-process",
    title: "Rabat Process: Euro-African Dialogue on Migration",
    date: "July 16, 2026",
    location: "Abuja, Nigeria",
    description: "The National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI) hosted the high-level Euro-African Dialogue on Migration and Development (Rabat Process) in Abuja. The meeting gathered member state delegations, international organizations, and policy experts to address safe, orderly, and regular migration, refugee protection, and joint development initiatives.",
    images: [
      { src: heroRabat1, title: "Nigeria Delegation at UN Rabat Dialogue", desc: "Delegates discussing multilateral migration governance at the summit." },
      { src: heroRabat2, title: "Euro-African Alliance Address", desc: "Hon. Commissioner presenting the opening remarks at the dialogue." },
      { src: heroRabat3, title: "Summit Policy Panel", desc: "Interactive session addressing regional security and migrant integration." },
      { src: heroRabat4, title: "Diplomatic Exchange", desc: "Presentation of bilateral cooperation symbols for durable solutions." },
      { src: heroRabat5, title: "Returnee Consultation Session", desc: "Bilateral strategy talks on humane, orderly return and reintegration." },
      { src: galleryRabat6, title: "Closing Ceremony & Abuja Declaration", desc: "European and African partners celebrate the adoption of the joint declaration." }
    ]
  },
  {
    id: "world-refugee-day",
    title: "World Refugee Day 2026: Restoring Hope, Protecting Dignity",
    date: "June 20, 2026",
    location: "Lagos & Abuja, Nigeria",
    description: "NCFRMI joined the global community in commemorating World Refugee Day 2026. Led by the Secretary to the Government of the Federation and the Minister of Humanitarian Affairs, NCFRMI hosted events focusing on empowering refugees through education, healthcare, and livelihood support to help them rebuild their lives with pride.",
    images: [
      { src: heroEvent2, title: "Commemoration Ceremony", desc: "SGF and Federal Commissioner celebrating World Refugee Day 2026." },
      { src: heroHumanitarian, title: "Restoring Dignity through Art", desc: "Refugee children presenting humanitarian artwork reflecting hope." },
      { src: galleryRefugee1, title: "Community Celebration", desc: "Refugees and community organizers smiling with messages of hope and resilience." },
      { src: galleryRefugee2, title: "Tailoring Workshop Empowerment", desc: "Vocational training session equipping returnees with sustainable tailoring skills." },
      { src: galleryRefugee3, title: "Camp School Classroom", desc: "Refugee children participating in class at an NCFRMI-supported camp school." },
      { src: galleryRefugee4, title: "Aid Package Distribution", desc: "NCFRMI staff distributing essential food and livelihood materials to families." }
    ]
  },
  {
    id: "durable-solutions",
    title: "Validation of National Strategy on Durable Solutions",
    date: "May 15, 2026",
    location: "Abuja, Nigeria",
    description: "NCFRMI convened a landmark validation session for the National Strategy on Durable Solutions for Refugees and IDPs. In collaboration with international development partners, the Commission inaugurated a Technical Working Group to lead sustainable integration, local resettlement, and socio-economic empowerment policies.",
    images: [
      { src: heroEvent1, title: "Validation Assembly", desc: "Stakeholders reviewing and validating the National Strategy document." },
      { src: hero1, title: "High-Level Opening Address", desc: "Federal Commissioner outlining the transition from relief to self-reliance." },
      { src: hero2, title: "Partner Engagement Forum", desc: "Representatives from UNHCR, ECOWAS, and civil society pledging support." },
      { src: hero3, title: "Technical Working Group Launch", desc: "Inaugurating the committee of experts tasked with policy implementation." },
      { src: gallerySolutions5, title: "Signing of the Strategy Accord", desc: "SGF and key partners signing the Durable Solutions commitment." },
      { src: gallerySolutions6, title: "Technical Committee Portrait", desc: "The newly inaugurated Technical Working Group standing in solidarity." }
    ]
  }
];

type LightboxState = {
  segmentIdx: number;
  imgIdx: number;
  src: string;
  title: string;
  description: string;
} | null;

export default function Gallery() {
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [activeSection, setActiveSection] = useState("rabat-process");

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  const handlePrev = () => {
    if (!lightbox) return;
    const segment = gallerySegments[lightbox.segmentIdx];
    const newImgIdx = (lightbox.imgIdx - 1 + segment.images.length) % segment.images.length;
    setLightbox({
      segmentIdx: lightbox.segmentIdx,
      imgIdx: newImgIdx,
      src: segment.images[newImgIdx].src,
      title: segment.images[newImgIdx].title,
      description: segment.images[newImgIdx].desc
    });
  };

  const handleNext = () => {
    if (!lightbox) return;
    const segment = gallerySegments[lightbox.segmentIdx];
    const newImgIdx = (lightbox.imgIdx + 1) % segment.images.length;
    setLightbox({
      segmentIdx: lightbox.segmentIdx,
      imgIdx: newImgIdx,
      src: segment.images[newImgIdx].src,
      title: segment.images[newImgIdx].title,
      description: segment.images[newImgIdx].desc
    });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = 120; // accounting for sticky header & subnav
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Media Gallery"
        title="Photo Archives &amp; Event Segments"
        description="Explore visual documentation of our summits, diplomatic dialogues, community events, and key humanitarian interventions across Nigeria."
      />

      {/* Sub-Navigation for Quick Anchors */}
      <div className="sticky top-[113px] z-30 border-b border-border bg-background/80 backdrop-blur-md py-4">
        <div className="container-page flex flex-wrap justify-center gap-2 sm:gap-4">
          {gallerySegments.map((seg) => (
            <button
              key={seg.id}
              onClick={() => scrollToSection(seg.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
                activeSection === seg.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted-hover hover:text-foreground"
              }`}
            >
              {seg.id === "rabat-process"
                ? "Rabat Process"
                : seg.id === "world-refugee-day"
                ? "World Refugee Day"
                : "Durable Solutions"}
            </button>
          ))}
        </div>
      </div>

      {/* SEGMENTS */}
      <div className="container-page py-12 space-y-24">
        {gallerySegments.map((segment, segIdx) => (
          <section
            key={segment.id}
            id={segment.id}
            className="scroll-mt-32 border-b border-border/40 pb-16 last:border-b-0 last:pb-0"
          >
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="max-w-3xl space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-[#0B663C]/10 text-[#0B663C] border-transparent font-bold text-[10px] uppercase tracking-wider">
                      Event Segment
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{segment.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{segment.location}</span>
                    </div>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {segment.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {segment.description}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Picture Tiles Grid (6 pictures) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {segment.images.map((img, imgIdx) => (
                <Reveal key={imgIdx} delay={imgIdx * 50} variant="scale">
                  <div
                    onClick={() =>
                      setLightbox({
                        segmentIdx: segIdx,
                        imgIdx,
                        src: img.src,
                        title: img.title,
                        description: img.desc
                      })
                    }
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
                      <p className="text-[10px] text-slate-350 line-clamp-2 mt-1">{img.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-10 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-all duration-200 z-50"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all duration-200 z-50 hover:scale-105 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all duration-200 z-50 hover:scale-105 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Lightbox Container */}
          <div
            className="relative max-w-5xl w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/10] w-full flex items-center justify-center bg-black overflow-hidden select-none">
              <img
                src={lightbox.src}
                alt={lightbox.title}
                className="max-h-full max-w-full object-contain duration-300 ease-in-out transition-all"
              />
            </div>
            <div className="bg-zinc-900 p-6 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white leading-tight">
                  {lightbox.title}
                </h3>
                <span className="text-xs text-zinc-500 font-medium">
                  {lightbox.imgIdx + 1} of {gallerySegments[lightbox.segmentIdx].images.length}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{lightbox.description}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

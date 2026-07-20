import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone, Globe, ChevronDown, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/ncfrmi-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "yo", label: "Yoruba" },
  { code: "ff", label: "Fula" },
  { code: "kr", label: "Kanuri" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "zh-CN", label: "Chinese" },
  { code: "es", label: "Spanish" },
];

const nav = [
  { to: "/", label: "Home" },
  {
    label: "About Us",
    children: [
      { to: "/who-we-are", label: "Who We Are" },
      { to: "/mandate", label: "Mandate" },
      { to: "/management-team", label: "Management Team" },
      { to: "/organogram", label: "Organogram" },
    ]
  },
  {
    label: "Our POCs",
    children: [
      { to: "/our-pocs", label: "All POCs" },
      { to: "/our-pocs?type=refugees", label: "Refugees" },
      { to: "/our-pocs?type=idps", label: "Internally Displaced" },
      { to: "/our-pocs?type=migrants", label: "Migrants" },
      { to: "/our-pocs?type=asylum-seekers", label: "Asylum Seekers" },
      { to: "/our-pocs?type=returnees", label: "Returnees" },
      { to: "/our-pocs?type=stateless", label: "Stateless Persons" },
    ]
  },
  {
    label: "Our Work",
    children: [
      { to: "/our-work", label: "All Interventions" },
      { to: "/our-work?program=refugee-protection", label: "Refugee Protection" },
      { to: "/our-work?program=rehabilitation", label: "Emergency Relief" },
      { to: "/our-work?program=migration-policy", label: "Migration Coordination" },
      { to: "/our-work?program=livelihood", label: "Livelihood & Reintegration" },
      { to: "/our-work?program=agriculture", label: "Agricultural Support" },
      { to: "/our-work?program=resettlement", label: "Resettlement Solutions" },
    ]
  },
  {
    label: "Media",
    children: [
      { to: "/news", label: "News" },
      { to: "/gallery", label: "Gallery" },
    ]
  },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact Us" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, role } = useAuth();
  const [currentLang, setCurrentLang] = useState("en");
  const [helpline, setHelpline] = useState("0800-NCFRMI");
  const [portalTitle, setPortalTitle] = useState("NCFRMI");

  const [tickerNews, setTickerNews] = useState<string[]>([]);

  useEffect(() => {
    const fetchTickerNews = async () => {
      try {
        const { data } = await supabase
          .from("news")
          .select("title")
          .order("created_at", { ascending: false })
          .limit(5);

        const hardcodedTitles = [
          "Rabat Process: Nigeria Hosts High-Level Euro-African Dialogue in Abuja",
          "NCFRMI Strengthens Bilateral Cooperation on Reintegration Support",
          "NCFRMI Validates National Strategy on Durable Solutions for refugees and IDPs",
          "World Refugee Day 2026: Commissioner Hails Lagos State's Support for Persons of Concern"
        ];

        if (data && data.length > 0) {
          const titles = data.map(item => item.title);
          setTickerNews([...titles, ...hardcodedTitles]);
        } else {
          setTickerNews(hardcodedTitles);
        }
      } catch (e) {
        console.error("Failed to load ticker news", e);
      }
    };
    fetchTickerNews();
  }, []);

  useEffect(() => {
    const loadSettings = () => {
      setHelpline(localStorage.getItem("ncfrmi_helpline") || "0800-NCFRMI");
      setPortalTitle(localStorage.getItem("ncfrmi_title") || "NCFRMI");
    };
    loadSettings();
    window.addEventListener("storage", loadSettings);
    const interval = setInterval(loadSettings, 1000);
    return () => {
      window.removeEventListener("storage", loadSettings);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Read the active language from the googtrans cookie on load
    try {
      const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z\-]{2,5})/);
      if (match && match[1]) {
        setCurrentLang(match[1]);
      }
    } catch (e) {
      console.error("Failed to parse googtrans cookie:", e);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    try {
      // 1. Set the googtrans cookie (works across page reloads and helps Google Translate engine pick it up)
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain};`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain};`;

      // 2. Trigger the Google Translate dropdown in the DOM programmatically with bubbling events
      const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (selectEl) {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        // Fallback: Reload the page to force Google Translate to read the cookie and translate
        window.location.reload();
      }
    } catch (e) {
      console.error("Language change error:", e);
      toast.error("Failed to apply translation.");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 supports-[backdrop-filter]:bg-background/70 ${
        scrolled
          ? "border-border/80 bg-background/90 shadow-card backdrop-blur"
          : "border-transparent bg-background/85 backdrop-blur"
      }`}
    >
      <div className="bg-[#0B663C] text-white text-xs border-b border-emerald-900/50">
        <div className="container-page flex h-9 items-center justify-between overflow-hidden gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-250 transition-colors">
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-250 transition-colors font-sans font-bold text-xs select-none">
              X
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-250 transition-colors">
              <Instagram className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Marquee Ticker */}
          <div className="relative flex-1 overflow-hidden h-full flex items-center">
            <style>{`
              @keyframes marquee {
                0% { transform: translate3d(100%, 0, 0); }
                100% { transform: translate3d(-100%, 0, 0); }
              }
              .animate-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: marquee 35s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="animate-marquee font-semibold cursor-pointer text-sm tracking-wide select-none">
              {tickerNews.length > 0 ? tickerNews.join("   •   ") : "Loading latest updates..."}
            </div>
          </div>

          {/* Helpline */}
          <a href={`tel:${helpline}`} className="hidden items-center gap-1.5 transition-opacity hover:opacity-90 sm:inline-flex flex-shrink-0 text-[11px] font-bold text-white">
            <Phone className="h-3.5 w-3.5 animate-pulse-soft" /> Helpline: {helpline}
          </a>
        </div>
      </div>
      <div className={`container-page flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
        <Link to="/" className="group flex items-center gap-3">
          <img
            src={logo}
            alt="NCFRMI seal"
            className="h-12 w-12 object-contain transition-transform group-hover:scale-105"
            width={48}
            height={48}
          />
          <div className="leading-tight">
            <div className="font-display text-base font-bold text-primary">{portalTitle}</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              National Commission for Refugees, Migrants & Internally Displaced Persons
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="relative group py-2">
                  <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground/75 group-hover:text-primary focus:outline-none">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-56 rounded-xl border border-border bg-background p-2 shadow-elegant animate-in fade-in duration-200 backdrop-blur-md">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted hover:text-primary ${
                            isActive ? "bg-muted text-primary" : "text-foreground/85"
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `link-underline rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "is-active text-primary" : "text-foreground/75"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-0">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Select Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-50">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`cursor-pointer justify-between text-xs py-1.5 ${
                    currentLang === lang.code ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                  }`}
                >
                  {lang.label}
                  {currentLang === lang.code && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {session && (
            <div className="flex items-center gap-2">
              {role === "superuser" && (
                <Button asChild size="sm" className="bg-emerald-800 hover:bg-emerald-700 hover-lift text-white font-bold">
                  <Link to="/super-admin">Super Admin Panel</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">

          {/* Mobile Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-0">
                <Globe className="h-3.5 w-3.5" />
                <span className="sr-only">Select Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 z-50">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`cursor-pointer justify-between text-xs py-1.5 ${
                    currentLang === lang.code ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                  }`}
                >
                  {lang.label}
                  {currentLang === lang.code && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="inline-flex items-center justify-center rounded-md p-2 transition-transform active:scale-90"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container-page flex flex-col py-3 space-y-1">
          {nav.map((item, i) => {
            if (item.children) {
              return (
                <div key={item.label} className="flex flex-col">
                  <div className="rounded-md px-3 py-2 text-sm font-bold text-primary uppercase tracking-wider text-[10px] mt-2">
                    {item.label}
                  </div>
                  <div className="pl-4 flex flex-col border-l border-primary/10 ml-3.5 space-y-1 mt-0.5 animate-in fade-in duration-200">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive ? "bg-muted text-primary font-bold" : "text-foreground/80 hover:bg-muted/40"
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-muted text-primary font-bold" : "text-foreground/80 hover:bg-muted/60"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
          {session && role === "superuser" && (
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild className="flex-1">
                <Link to="/super-admin" onClick={() => setOpen(false)}>Super Admin Panel</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Invisible target element for Google Translate widget */}
      <div id="google_translate_element" className="absolute -top-[9999px] -left-[9999px] h-px w-px overflow-hidden opacity-0 pointer-events-none" />
    </header>
  );
};

export default Header;

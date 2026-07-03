import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/ncfrmi-logo.png";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/apply", label: "Apply" },
  { to: "/idp-camps", label: "IDP Camps" },
  { to: "/news", label: "News" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, role } = useAuth();
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Read the active language from the googtrans cookie on load
    try {
      const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
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

      // 2. Trigger the Google Translate dropdown in the DOM
      const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (selectEl) {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event("change"));
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
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container-page flex h-9 items-center justify-between">
          <span className="font-medium">Federal Republic of Nigeria · Official Government Website</span>
          <a href="tel:+2340000000000" className="hidden items-center gap-2 transition-opacity hover:opacity-80 sm:inline-flex">
            <Phone className="h-3.5 w-3.5 animate-pulse-soft" /> 24/7 Helpline: 0800-NCFRMI
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
            <div className="font-display text-base font-bold text-primary">NCFRMI</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              National Commission for Refugees, Migrants & IDPs
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `link-underline rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "is-active text-primary" : "text-foreground/75"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {/* Language Selector */}
          <div className="relative flex items-center gap-1.5 rounded-full border bg-background/50 px-2.5 py-1 text-xs transition-colors hover:bg-background/80">
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer text-foreground"
            >
              <option value="en" className="bg-background text-foreground">English</option>
              <option value="ha" className="bg-background text-foreground">Hausa</option>
              <option value="ig" className="bg-background text-foreground">Igbo</option>
              <option value="yo" className="bg-background text-foreground">Yoruba</option>
              <option value="ff" className="bg-background text-foreground">Fulani</option>
              <option value="kr" className="bg-background text-foreground">Kanuri</option>
            </select>
          </div>



          {session && (
            <div className="flex items-center gap-2">
              {role === "commissioner" && (
                <Button asChild size="sm" className="hover-lift">
                  <Link to="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              {role === "officer" && (
                <>
                  <Button asChild variant="outline" size="sm" className="hover-lift">
                    <Link to="/field-capture">Field Capture</Link>
                  </Button>
                  <Button asChild size="sm" className="hover-lift">
                    <Link to="/registrants">Registrants Directory</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">


          {/* Mobile Language Selector */}
          <div className="relative flex items-center gap-1.5 rounded-full border bg-background/50 px-2 py-0.5 text-xs transition-colors hover:bg-background/80">
            <Globe className="h-3 w-3 opacity-60" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer text-foreground max-w-[65px] text-[10px]"
            >
              <option value="en" className="bg-background text-foreground">EN</option>
              <option value="ha" className="bg-background text-foreground">HA</option>
              <option value="ig" className="bg-background text-foreground">IG</option>
              <option value="yo" className="bg-background text-foreground">YO</option>
              <option value="ff" className="bg-background text-foreground">FF</option>
              <option value="kr" className="bg-background text-foreground">KR</option>
            </select>
          </div>

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
        <div className="container-page flex flex-col py-3">
          {nav.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              style={{ animationDelay: open ? `${i * 40}ms` : undefined }}
              className={({ isActive }) =>
                `${open ? "animate-fade-up" : ""} rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-muted text-primary" : "text-foreground/80 hover:bg-muted/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {session && (
            <div className="mt-3 flex flex-col gap-2">
              {role === "commissioner" && (
                <Button asChild className="flex-1">
                  <Link to="/admin/dashboard" onClick={() => setOpen(false)}>Admin Dashboard</Link>
                </Button>
              )}
              {role === "officer" && (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/field-capture" onClick={() => setOpen(false)}>Field Capture</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/registrants" onClick={() => setOpen(false)}>Registrants Directory</Link>
                  </Button>
                </>
              )}
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

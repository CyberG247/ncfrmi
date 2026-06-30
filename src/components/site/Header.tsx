import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
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
  { to: "/offices", label: "Offices" },
  { to: "/news", label: "News" },
  { to: "/field-capture", label: "Field Capture" },
  { to: "/registrants", label: "Registrants" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            className="h-12 w-12 object-contain animate-spin transition-transform group-hover:scale-105"
            style={{ animationDuration: "8s", animationTimingFunction: "linear" }}
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
          {session ? (
            <>
              <NotificationBell />
              <Button asChild variant="outline" size="sm" className="hover-lift"><Link to="/dashboard">Dashboard</Link></Button>
              <Button asChild size="sm" className="hover-lift"><Link to="/dashboard/new">New application</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hover-lift"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm" className="hover-lift"><Link to="/apply">Start application</Link></Button>
            </>
          )}
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 transition-transform active:scale-90 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/apply" onClick={() => setOpen(false)}>Apply</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

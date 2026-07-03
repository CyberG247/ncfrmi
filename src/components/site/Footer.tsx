import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/ncfrmi-logo.png";

export const Footer = () => {
  return (
    <footer className="mt-24 border-t border-border bg-secondary text-secondary-foreground">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="NCFRMI seal" className="h-12 w-12 object-contain" width={48} height={48} />
            <div className="font-display text-lg font-bold">NCFRMI</div>
          </div>
          <p className="mt-4 text-sm text-secondary-foreground/75">
            Protecting, assisting, and empowering refugees, migrants, and internally displaced persons across Nigeria since 1989.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="rounded-full bg-secondary-foreground/10 p-2 transition-base hover:bg-primary">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-secondary-foreground/80">
            {[
              ["About Us", "/about"],
              ["Online Application", "/apply"],
              ["Zonal & State Offices", "/offices"],
              ["News & Updates", "/news"],
              ["Report Incident", "/report"],
            ].map(([l, h]) => (
              <li key={h}><Link to={h} className="hover:text-primary-foreground">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-secondary-foreground/80">
            {[
              "Asylum & Protection",
              "IDP Registration",
              "Returnee Reintegration",
              "Migration Management",
              "Legal Aid & Documentation",
              "Durable Solutions",
            ].map((s) => (
              <li key={s}><Link to="/services" className="hover:text-primary-foreground">{s}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider">Headquarters</h4>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/80">
            <li className="flex gap-3"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Plot 2280, Mohammadu Buhari Way, CBD, Abuja</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 mt-0.5 shrink-0" /> +234 (0)9 461 0000</li>
            <li className="flex gap-3"><Mail className="h-4 w-4 mt-0.5 shrink-0" /> info@ncfrmi.gov.ng</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/15">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-secondary-foreground/70 sm:flex-row">
          <p>© {new Date().getFullYear()} National Commission for Refugees, Migrants and IDPs. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-primary-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-foreground">Terms of Use</Link>
            <Link to="/accessibility" className="hover:text-primary-foreground">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

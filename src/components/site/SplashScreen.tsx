import { useEffect, useState } from "react";
import logo from "@/assets/ncfrmi-logo.png";

interface Props {
  minDuration?: number;
  ready?: boolean;
}

export default function SplashScreen({ minDuration = 3000, ready = true }: Props) {
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  useEffect(() => {
    if (minElapsed && ready) setVisible(false);
  }, [minElapsed, ready]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background animate-in fade-in duration-500 px-4">
      <div className="flex flex-col items-center text-center max-w-2xl">
        <img
          src={logo}
          alt="NCFRMI seal"
          className="h-24 w-24 sm:h-32 sm:w-32 object-contain drop-shadow-xl"
        />
        <h1 className="mt-6 font-display text-lg sm:text-2xl md:text-3xl font-bold text-primary">
          Welcome to the Official Website of the
        </h1>
        <h2 className="mt-1 font-display text-base sm:text-xl md:text-2xl font-semibold text-foreground">
          National Commission for Refugees, Migrants & Internally Displaced Persons
        </h2>
        <p className="mt-3 text-xs sm:text-sm md:text-base text-muted-foreground">
          Federal Republic of Nigeria — Protecting and empowering displaced persons
          through compassion, dignity, and lawful service.
        </p>
        <div className="mt-6 flex items-center gap-2" aria-label="Loading">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          {ready ? "Finalizing…" : "Loading critical data…"}
        </p>
      </div>
    </div>
  );
}

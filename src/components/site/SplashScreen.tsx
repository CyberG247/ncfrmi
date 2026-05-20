import { useEffect, useState } from "react";
import logo from "@/assets/ncfrmi-logo.png";

export default function SplashScreen({ minDuration = 3000 }: { minDuration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center px-6">
        <img
          src={logo}
          alt="NCFRMI seal"
          className="h-32 w-32 sm:h-40 sm:w-40 object-contain animate-pulse drop-shadow-xl"
        />
        <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-primary">
          Welcome to the Official Website of the
        </h1>
        <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-foreground">
          National Commission for Refugees, Migrants & Internally Displaced Persons
        </h2>
        <p className="mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
          Federal Republic of Nigeria — Protecting and empowering displaced persons
          through compassion, dignity, and lawful service.
        </p>
        <div className="mt-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}

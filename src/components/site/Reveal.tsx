import { useEffect, useRef, useState, type HTMLAttributes, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  delay?: number;
  variant?: "up" | "scale" | "blur";
  once?: boolean;
}

/** Reveal-on-scroll wrapper using IntersectionObserver. Lightweight, dependency-free. */
export const Reveal = ({
  as,
  delay = 0,
  variant = "up",
  once = true,
  className,
  style,
  children,
  ...rest
}: RevealProps) => {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const variantClass = variant === "scale" ? "reveal-scale" : variant === "blur" ? "reveal-blur" : "";

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", variantClass, visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;

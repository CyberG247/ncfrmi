interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
}

export const PageHero = ({ eyebrow, title, description }: Props) => (
  <section className="relative overflow-hidden hero-animated text-primary-foreground">
    <div className="pointer-events-none absolute inset-0">
      <span className="particle h-32 w-32 left-[10%] top-[20%] animate-float-slow" />
      <span className="particle h-20 w-20 right-[15%] top-[60%] animate-float" style={{ animationDelay: "1.2s" }} />
    </div>
    <div className="container-page relative py-16 sm:py-20">
      {eyebrow && (
        <div className="mb-3 animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">
          {eyebrow}
        </div>
      )}
      <h1 className="animate-blur-in font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-3xl animate-fade-up text-base text-primary-foreground/85 sm:text-lg" style={{ animationDelay: "150ms" }}>
          {description}
        </p>
      )}
    </div>
  </section>
);

export default PageHero;


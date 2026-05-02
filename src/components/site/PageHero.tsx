interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
}

export const PageHero = ({ eyebrow, title, description }: Props) => (
  <section className="bg-gradient-hero text-primary-foreground">
    <div className="container-page py-16 sm:py-20">
      {eyebrow && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-3xl text-base text-primary-foreground/85 sm:text-lg">{description}</p>
      )}
    </div>
  </section>
);

export default PageHero;

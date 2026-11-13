/**
 * Shell for the two legal pages. They are plain reading pages: no hero, no
 * animation, one column that stays readable from a phone to a desktop.
 *
 * Square-bracketed text in these pages is a placeholder for information the
 * club still has to supply (entity name, addresses, retention periods). It is
 * deliberately visible rather than guessed at.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-6 pt-28 pb-20 md:px-12">
      <article className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-4xl text-dark md:text-6xl dark:text-white">{title}</h1>
        <p className="mt-3 text-sm text-dark/50 dark:text-white/50">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 text-dark/70 dark:text-white/70">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 leading-relaxed">
      <h2 className="text-xl font-semibold text-dark md:text-2xl dark:text-white">{heading}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

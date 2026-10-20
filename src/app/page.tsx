import { TranslatorClient } from "@/components/TranslatorClient";

export default function HomePage() {
  return (
    <>
      <TranslatorClient />
      <section className="px-5 pb-10 md:px-8">
        <div className="grid gap-3 rounded-[28px] border border-line bg-panel p-5 md:grid-cols-4">
          {[
            ["Hold still", "Keep a letter in frame until the gold bar fills."],
            ["Open palm", "Adds a space while fingerspelling."],
            ["Phrase mode", "Hello, yes, no, thank you, I love you."],
            ["Save", "Keep a translation in this browser."],
          ].map(([title, copy]) => (
            <article key={title}>
              <h2 className="font-display text-xl">{title}</h2>
              <p className="mt-1 text-sm text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

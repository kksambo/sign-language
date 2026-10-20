import { LETTER_HINTS, PHRASE_HINTS } from "@/lib/sign-hints";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function SignGuide({
  current,
  mode,
}: {
  current?: string;
  mode: "fingerspell" | "phrases";
}) {
  if (mode === "phrases") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(PHRASE_HINTS).map(([label, hint]) => (
          <article
            key={label}
            className={`rounded-2xl border px-3 py-2 ${
              current === label ? "border-gold bg-gold/10" : "border-line bg-bg-soft"
            }`}
          >
            <p className="font-display text-lg">{label}</p>
            <p className="text-sm text-muted">{hint}</p>
          </article>
        ))}
      </div>
    );
  }

  const hint = current ? LETTER_HINTS[current] : "Hold a letter still until it locks.";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {LETTERS.map((letter) => (
          <span
            key={letter}
            className={`grid h-8 w-8 place-items-center rounded-lg border text-sm ${
              current === letter ? "border-gold bg-gold text-bg" : "border-line bg-bg-soft"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </div>
  );
}

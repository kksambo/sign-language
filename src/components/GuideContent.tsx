import { LETTER_HINTS, PHRASE_HINTS } from "@/lib/sign-hints";

const letterList = Object.keys(LETTER_HINTS).map((gloss) => ({
  gloss,
  hint: LETTER_HINTS[gloss],
}));

const phraseList = Object.entries(PHRASE_HINTS).map(([gloss, hint]) => ({
  gloss,
  hint,
}));

export function GuideContent() {
  return (
    <div className="px-5 py-8 md:px-8">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">How to use it</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl md:text-5xl">
        Sit in good light, keep one hand in the camera, and hold each sign until it locks.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        The browser tracks 21 hand landmarks with MediaPipe, then classifies ASL fingerspelling and everyday phrases.
        Video, settings, and saved translations stay on this device.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border border-line bg-panel p-5">
          <h2 className="font-display text-2xl">1. Start the camera</h2>
          <p className="mt-2 text-muted">Allow webcam access. Landmarks appear when a hand is in frame.</p>
        </article>
        <article className="rounded-[24px] border border-line bg-panel p-5">
          <h2 className="font-display text-2xl">2. Hold the sign</h2>
          <p className="mt-2 text-muted">Keep the letter or phrase still until the gold bar fills and the text locks.</p>
        </article>
        <article className="rounded-[24px] border border-line bg-panel p-5">
          <h2 className="font-display text-2xl">3. Edit and save</h2>
          <p className="mt-2 text-muted">Fix the English text, speak it aloud, and save it in this browser.</p>
        </article>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Common phrases</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {phraseList.map((row) => (
            <article key={row.gloss} className="rounded-[24px] border border-line bg-panel p-4">
              <p className="font-display text-2xl">{row.gloss}</p>
              <p className="mt-1 text-muted">{row.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">ASL alphabet</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {letterList.map((row) => (
            <article key={row.gloss} className="flex items-start gap-3 rounded-2xl border border-line bg-panel p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 font-display text-xl text-gold">
                {row.gloss}
              </span>
              <p className="text-sm text-muted">{row.hint}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const WebcamTranslator = dynamic(() => import("@/components/WebcamTranslator").then((mod) => mod.WebcamTranslator), {
  ssr: false,
  loading: () => <div className="px-5 py-16 text-center text-muted md:px-8">Loading camera workspace…</div>,
});

export function TranslatorClient() {
  return <WebcamTranslator />;
}

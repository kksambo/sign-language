import type { Metadata } from "next";
import { GuideContent } from "@/components/GuideContent";

export const metadata: Metadata = {
  title: "Guide · Sign Language Translator",
};

export default function AboutPage() {
  return <GuideContent />;
}

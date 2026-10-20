import type { Metadata } from "next";
import { HistoryList } from "@/components/HistoryList";

export const metadata: Metadata = {
  title: "History · Sign Language Translator",
};

export default function HistoryPage() {
  return <HistoryList />;
}

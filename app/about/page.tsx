import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Our Story — Bombay Sweets",
  description: "Decades of North Indian cooking and Indian sweets, made fresh in Port Coquitlam.",
};

export default function AboutPage() {
  return (
    <main className="px-6 py-24 lg:px-10">
      <Eyebrow>Our Story</Eyebrow>
      <h1 className="mt-4 font-display text-[56px] leading-[0.95] text-ink lg:text-[88px]">
        Rooted in tradition,
        <br />
        made for today
      </h1>
      <p className="mt-6 max-w-xl font-body text-lg text-ink/70">
        The full brand story is coming to this page.
      </p>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IntentChips } from "@/components/discovery/IntentChips";
import { FreeTextInput } from "@/components/discovery/FreeTextInput";
import { ResultCard } from "@/components/discovery/ResultCard";
import { CountUp } from "@/components/motion/CountUp";
import { runDiscovery } from "@/lib/discovery/score";
import type { ChipId } from "@/lib/discovery/chips";

const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function DiscoveryPanel() {
  const [activeChips, setActiveChips] = useState<ChipId[]>([]);
  const [freeText, setFreeText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [surpriseNonce, setSurpriseNonce] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedText(freeText), 250);
    return () => clearTimeout(id);
  }, [freeText]);

  const activeChipsKey = activeChips.join(",");
  const hasQuery = activeChips.length > 0 || debouncedText.trim().length > 0;

  const outcome = useMemo(() => {
    if (!hasQuery) return null;
    return runDiscovery(activeChips, debouncedText);
    // activeChipsKey/surpriseNonce force a recompute when chips or the "Surprise Me" reroll change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChipsKey, debouncedText, surpriseNonce, hasQuery]);

  function toggleChip(id: ChipId) {
    if (id === "SURPRISE_ME") {
      setActiveChips((prev) => (prev.includes("SURPRISE_ME") ? prev : ["SURPRISE_ME"]));
      setSurpriseNonce((n) => n + 1);
      return;
    }
    setActiveChips((prev) => {
      const withoutSurprise = prev.filter((c) => c !== "SURPRISE_ME");
      return withoutSurprise.includes(id)
        ? withoutSurprise.filter((c) => c !== id)
        : [...withoutSurprise, id];
    });
  }

  const resultKey = outcome
    ? `${outcome.ackLine}|${outcome.results.map((r) => r.item.id).join(",")}`
    : "empty";

  return (
    <div className="mt-10 flex flex-col items-center gap-8">
      <IntentChips active={activeChips} onToggle={toggleChip} />

      <div className="w-full max-w-lg">
        <FreeTextInput value={freeText} onChange={setFreeText} />
      </div>

      <AnimatePresence mode="wait">
        {outcome && (
          <motion.div
            key={resultKey}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="w-full"
          >
            <motion.p variants={fadeUp} className="font-display text-2xl text-ink lg:text-3xl">
              {outcome.ackLine}
            </motion.p>

            {outcome.results.length === 0 ? (
              <motion.p variants={fadeUp} className="mt-4 font-body text-ink/60">
                Nothing quite matched that combination — try a different chip or word.
              </motion.p>
            ) : (
              <>
                <motion.p
                  variants={fadeUp}
                  className="mt-2 font-label text-xs uppercase tracking-[0.15em] text-ink/50"
                >
                  <CountUp value={outcome.results.length} /> dish
                  {outcome.results.length !== 1 ? "es" : ""} found
                </motion.p>
                <div className="mt-6 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
                  {outcome.results.map((result) => (
                    <motion.div key={result.item.id} variants={fadeUp}>
                      <ResultCard result={result} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

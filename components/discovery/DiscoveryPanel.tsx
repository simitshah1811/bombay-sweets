"use client";

import { useEffect, useMemo, useState } from "react";
import { IntentChips } from "@/components/discovery/IntentChips";
import { FreeTextInput } from "@/components/discovery/FreeTextInput";
import { ResultCard } from "@/components/discovery/ResultCard";
import { runDiscovery } from "@/lib/discovery/score";
import type { ChipId } from "@/lib/discovery/chips";
import { cn } from "@/lib/utils/cn";

export function DiscoveryPanel() {
  const [activeChips, setActiveChips] = useState<ChipId[]>([]);
  const [freeText, setFreeText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [surpriseNonce, setSurpriseNonce] = useState(0);
  const [resultsRevealed, setResultsRevealed] = useState(false);

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

  useEffect(() => {
    if (!outcome) return;
    const id = setTimeout(() => setResultsRevealed(true), 400);
    return () => clearTimeout(id);
  }, [outcome]);

  const showResults = outcome !== null && resultsRevealed;

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

  return (
    <div className="mt-10 flex flex-col items-center gap-8">
      <IntentChips active={activeChips} onToggle={toggleChip} />

      <div className="w-full max-w-lg">
        <FreeTextInput value={freeText} onChange={setFreeText} />
      </div>

      {outcome && (
        <div className="w-full">
          <p className="font-display text-2xl text-ink lg:text-3xl">{outcome.ackLine}</p>

          {outcome.results.length === 0 ? (
            <p className="mt-4 font-body text-ink/60">
              Nothing quite matched that combination — try a different chip or word.
            </p>
          ) : (
            <>
              <p className="mt-2 font-label text-xs uppercase tracking-[0.15em] text-ink/50">
                {outcome.results.length} dish{outcome.results.length !== 1 ? "es" : ""} found
              </p>
              <div
                className={cn(
                  "mt-6 grid grid-cols-1 gap-5 text-left transition-opacity duration-500 sm:grid-cols-2 lg:grid-cols-4",
                  showResults ? "opacity-100" : "opacity-0"
                )}
              >
                {outcome.results.map((result) => (
                  <ResultCard key={result.item.id} result={result} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

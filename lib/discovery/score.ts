import { MENU_ITEMS } from "@/data/menu";
import { MENU_TAGS } from "@/data/menu-tags";
import type { MenuItem } from "@/data/types";
import { CHIPS, getChip, type ChipId } from "./chips";
import { NEGATION_WORDS, STOPWORDS, SYNONYMS } from "./keywords";

export interface DiscoveryResult {
  item: MenuItem;
  reasons: string[];
}

export interface DiscoveryOutcome {
  results: DiscoveryResult[];
  ackLine: string;
}

function clean(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function expand(tokens: string[]): string[] {
  const set = new Set<string>();
  tokens.forEach((t) => {
    set.add(t);
    (SYNONYMS[t] ?? []).forEach((s) => set.add(s));
  });
  return Array.from(set);
}

function detectNegatedTerms(rawTokens: string[]): Set<string> {
  const negated = new Set<string>();
  rawTokens.forEach((tok, i) => {
    if (NEGATION_WORDS.has(tok) && rawTokens[i + 1]) {
      negated.add(rawTokens[i + 1]);
    }
  });
  return negated;
}

function buildReasons(chipLabels: string[], keywords: string[]): string[] {
  const reasons = Array.from(new Set(chipLabels));
  if (keywords.length > 0) {
    reasons.push(`Matches "${keywords[0]}"`);
  }
  return reasons.slice(0, 3);
}

function buildAckLine(activeChips: ChipId[], searchTokens: string[]): string {
  const realChips = activeChips.filter((c) => c !== "SURPRISE_ME");
  if (activeChips.includes("SURPRISE_ME") && realChips.length === 0) {
    return getChip("SURPRISE_ME").ack;
  }
  if (realChips.length > 0) {
    return getChip(realChips[0]).ack;
  }
  if (searchTokens.length > 0) {
    return `${capitalize(searchTokens[0])}? Say no more.`;
  }
  return "Here's what fits.";
}

export function runDiscovery(activeChips: ChipId[], freeText: string): DiscoveryOutcome {
  const rawTokens = clean(freeText);
  const searchTokens = expand(rawTokens.filter((t) => !STOPWORDS.has(t)));
  const negated = detectNegatedTerms(rawTokens);
  const isPureSurprise = activeChips.length === 1 && activeChips[0] === "SURPRISE_ME" && searchTokens.length === 0;

  const scored = MENU_ITEMS.map((item) => {
    const tags = MENU_TAGS[item.id];
    const haystack = `${item.name} ${item.description ?? ""}`.toLowerCase();

    let score = 0;
    const firedChipLabels: string[] = [];
    for (const chipId of activeChips) {
      if (chipId === "SURPRISE_ME") continue;
      const chip = CHIPS.find((c) => c.id === chipId)!;
      const contribution = chip.score(tags);
      score += contribution;
      if (contribution > 0) firedChipLabels.push(chip.label);
    }

    const matchedKeywords: string[] = [];
    searchTokens.forEach((token) => {
      if (!haystack.includes(token)) return;
      if (negated.has(token)) {
        score -= 8;
        return;
      }
      score += item.name.toLowerCase().includes(token) ? 6 : 3;
      matchedKeywords.push(token);
    });

    if (isPureSurprise) {
      score = (tags.comfort || tags.dessert ? 2 : 0.5) + Math.random() * 4;
    }

    return { item, score, firedChipLabels, matchedKeywords };
  });

  const results: DiscoveryResult[] = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => ({
      item: r.item,
      reasons: buildReasons(r.firedChipLabels, r.matchedKeywords),
    }));

  return { results, ackLine: buildAckLine(activeChips, searchTokens) };
}

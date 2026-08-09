"use client";

export function FreeTextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Or describe your craving — “something spicy and vegetarian”"
      className="w-full rounded-pill border border-ink/25 bg-cream px-6 py-4 font-body text-ink placeholder:text-ink/40 transition-colors focus:border-ink focus:outline-none"
    />
  );
}

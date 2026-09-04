"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Invalid email or password.");
        setSubmitting(false);
        return;
      }

      const from = searchParams.get("from");
      router.push(from && from.startsWith("/admin") ? from : "/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block font-label text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-control border border-ink/20 bg-cream px-4 py-3 text-sm text-ink outline-none focus:border-ink/60"
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-label text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-control border border-ink/20 bg-cream px-4 py-3 text-sm text-ink outline-none focus:border-ink/60"
        />
      </div>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-pill bg-saffron px-6 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-ink disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

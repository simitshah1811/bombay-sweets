"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { AdminRole } from "@/lib/generated/prisma/client";

const ROLE_LABEL: Record<AdminRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export function AdminNav({
  role,
  name,
  restaurantName,
  canManageMenu,
  canManageSettings,
}: {
  role: AdminRole;
  name: string;
  restaurantName: string;
  canManageMenu: boolean;
  canManageSettings: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/orders", label: "Orders", show: true },
    { href: "/admin/menu", label: "Menu", show: canManageMenu },
    { href: "/admin/settings", label: "Settings", show: canManageSettings },
  ].filter((link) => link.show);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-ink/15 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="font-display text-lg font-semibold tracking-tight text-ink">
            {restaurantName} <span className="text-ink/50 font-body text-sm font-normal">Admin</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-control px-3 py-2 font-label text-xs font-medium uppercase tracking-[0.12em] transition-colors",
                    active ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/10"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium text-ink">{name}</div>
            <div className="font-label text-[11px] uppercase tracking-[0.12em] text-ink/50">{ROLE_LABEL[role]}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-control border border-ink/30 px-3 py-2 font-label text-xs font-medium uppercase tracking-[0.12em] text-ink/70 transition-colors hover:bg-ink hover:text-cream disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}

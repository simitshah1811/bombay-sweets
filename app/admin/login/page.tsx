import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-peach/40 px-6">
      <div className="w-full max-w-sm rounded-image border border-ink/15 bg-cream p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Bombay Sweets Admin</h1>
        <p className="mt-1 text-sm text-ink/60">Sign in to manage orders, menu, and settings.</p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

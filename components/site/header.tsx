"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

function AuthControls({ onNavigate }: { onNavigate?: () => void }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/admin"
          onClick={onNavigate}
          className="text-sm font-medium text-ink/70 transition hover:text-ink"
        >
          Admin
        </Link>
        <UserButton />
      </>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-ink/70 transition hover:text-ink"
      >
        Sign in
      </button>
    </SignInButton>
  );
}

export function SiteHeader({ clerkEnabled }: { clerkEnabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-linen/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-ink">
          {siteConfig.name}
        </Link>
        <button
          type="button"
          className="rounded-full border border-black/10 p-2 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <nav className="hidden items-center gap-6 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-ink/70 transition hover:text-ink">
              {item.label}
            </Link>
          ))}
          {clerkEnabled ? <AuthControls /> : null}
        </nav>
      </div>
      <nav
        className={cn(
          "overflow-hidden border-t border-black/5 px-6 transition-all lg:hidden",
          open ? "max-h-80 py-4" : "max-h-0 py-0",
        )}
      >
        <div className="flex flex-col gap-3">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/70 transition hover:text-ink"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {clerkEnabled ? (
            <div className="flex items-center gap-4 pt-2">
              <AuthControls onNavigate={() => setOpen(false)} />
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

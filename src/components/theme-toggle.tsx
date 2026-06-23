"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("themechange", cb);
  return () => window.removeEventListener("themechange", cb);
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3.5 text-left font-medium transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        {dark ? <Moon className="size-5 text-muted-foreground" /> : <Sun className="size-5 text-muted-foreground" />}
        Tema {dark ? "escuro" : "claro"}
      </span>
      <span className="text-sm text-muted-foreground">Alternar</span>
    </button>
  );
}

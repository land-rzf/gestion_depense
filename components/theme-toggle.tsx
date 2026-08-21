"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel))] text-[rgb(var(--muted))] transition hover:text-teal-700 dark:hover:text-teal-300" aria-label="Changer le thème">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

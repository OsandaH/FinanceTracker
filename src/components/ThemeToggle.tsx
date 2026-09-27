"use client";

import { useEffect, useState } from "react";

type ThemePref = "light" | "dark" | "system";

function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
  window.localStorage.setItem("finance-tracker:theme", pref);
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("finance-tracker:theme") as ThemePref | null;
    if (stored) setPref(stored);
  }, []);

  function cycle() {
    const next: ThemePref = pref === "system" ? "light" : pref === "light" ? "dark" : "system";
    setPref(next);
    applyTheme(next);
  }

  const icon = pref === "light" ? "☀️" : pref === "dark" ? "🌙" : "🌗";
  const label = pref === "light" ? "Light" : pref === "dark" ? "Dark" : "System";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:bg-bg"
      aria-label={`Theme: ${label}. Click to change.`}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

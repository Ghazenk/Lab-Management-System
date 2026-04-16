import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggle: () => void;
}

export default function ThemeToggle({ isDark, toggle }: ThemeToggleProps) {
  return (
    <button
      onClick={toggle}
      className="p-2 border border-border text-on-surface-dim hover:text-primary transition-colors group flex items-center gap-2"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="text-[10px] uppercase tracking-widest font-medium">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}

/**
 * Tokens do Design System da Dioris (referência TS).
 * Os valores reais são declarados como CSS variables em `src/styles.css`
 * e expostos como utilitários do Tailwind v4 via `@theme inline`.
 * Este arquivo apenas nomeia os tokens para uso em código.
 */
export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  "4xl": "var(--radius-4xl)",
} as const;

export const color = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  muted: "var(--muted)",
  accent: "var(--accent)",
  destructive: "var(--destructive)",
  border: "var(--border)",
  ring: "var(--ring)",
} as const;

export const motion = {
  fast: "150ms",
  base: "220ms",
  slow: "360ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  easingEmphasized: "cubic-bezier(0.3, 0, 0, 1)",
} as const;

export type Radius = keyof typeof radius;
export type ColorToken = keyof typeof color;
